module supercircle_addr::SuperCircle_01 {
    use std::signer;
    use std::vector;
    use std::string;
    use std::option;
    use std::timestamp;

    use aptos_framework::aptos_account;
    use aptos_framework::event;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_framework::coin::{Self, Coin};
    use aptos_framework::object::{Self, Object, ExtendRef};

    /// Error codes
    const ERR_INSUFFICIENT_BALANCE: u64 = 1;  // Insufficient balance
    const ERR_INVALID_STAKE_AMOUNT: u64 = 2;  // Invalid stake amount
    const ERR_CIRCLE_NOT_FOUND: u64 = 3;  // Circle not found
    const ERR_CIRCLE_OPPONENT_ALREADY_EXISTS: u64 = 4;  // Opponent already exists
    const ERR_CIRCLE_ALREADY_RESOLVED: u64 = 5;  // Circle already resolved
    const ERR_NOT_AI_SIGNER: u64 = 6;  // Not AI signer

    const VAULT_SEED: vector<u8> = b"vault";
    const AI_SIGNER_ADDRESS: address = @0xDEADBEEF; // TODO: change to actual AI signer address


    /// Supporter structure holds the address of the supporter and the amount of stake they have
    struct Supporter has copy, drop, store {
        addr: address,
        amount: u64, // amount staked
    }

    /// Circle structure
    struct Circle has key {
        id: u64,
        creator: address,
        opponent: address,
        description: string::String,
        deadline: u64, // timestamp
        creator_stake: u64,
        opponent_stake: u64,
        creator_supporter_pct: u8, // percentage of prize money for creator's supporters
        opponent_supporter_pct: u8, // percentage of prize money for opponent's supporters
        creator_supporters: vector<Supporter>,
        opponent_supporters: vector<Supporter>,
        resolved: bool,
        winner: option::Option<address>,
        status: u8, // 0 = Pending, 1 = Active, 2 = Resolved
        prize_pool: u64,
    }

    /// Resource to store all circles
    struct CircleBook has key {
        circles: vector<Circle>,
        next_id: u64,
    }

    /// Vault stores the APT for the circle
    struct Vault has key {
        extend_ref: ExtendRef,
    }


    // ================================= Event ================================== //
    
    #[event]
    struct CircleCreatedEvent has store, drop {
        id: u64,
        creator: address,
        description: string::String,
        deadline: u64,
        prize_pool: u64,
    }

    #[event]
    struct CircleAcceptedEvent has store, drop {
        id: u64,
        opponent: address,
        opponent_supporter_pct: u8,
    }

    #[event]
    struct CircleSupporterJoinedEvent has store, drop {
        id: u64,
        side: u8, // 0 = creator, 1 = opponent
        amount: u64,
    }

    /// Initialize the CircleBook resource
    public entry fun init(sender: &signer) {
        let vault_constructor_ref = &object::create_named_object(sender, VAULT_SEED);
        let vault_signer = &object::generate_signer(vault_constructor_ref);

        move_to(vault_signer, Vault {
            extend_ref: object::generate_extend_ref(vault_constructor_ref),
        });

        move_to(sender, CircleBook {
            circles: vector::empty<Circle>(),
            next_id: 0,
        });
    }

    // ================================= Entry functions ================================== //

    /// Create a new challenge
    public entry fun create_circle(
        creator: &signer,
        description: string::String,
        deadline: u64,
        creator_supporter_pct: u8,
        prize_pool: u64,
    ) acquires CircleBook {
        let creator_addr = signer::address_of(creator);
        let creator_stake = prize_pool/2;

        // Validations
        assert!(coin::balance<AptosCoin>(creator_addr) >= creator_stake, ERR_INSUFFICIENT_BALANCE);

        let circle_book = borrow_global_mut<CircleBook>(@supercircle_addr);
        
        let id = circle_book.next_id;
        circle_book.next_id = id + 1;

        // Take the creator's stake
        let opponent_stake = 0u64;

        // Store the circle
        let circle = Circle {
            id,
            creator: creator_addr,
            opponent: option::none<address>(),
            description,
            deadline,
            creator_stake,
            opponent_stake,
            creator_supporter_pct,
            opponent_supporter_pct: 0u8, // not set yet
            creator_supporters: vector::empty<Supporter>(),
            opponent_supporters: vector::empty<Supporter>(),
            resolved: false,
            winner: option::none<address>(),
            status: 0u8, // Pending
            prize_pool,
        };
        vector::push_back(&mut circle_book.circles, circle);

        // Transfer the stake to the vault
        aptos_account::transfer(creator, get_vault_addr(), creator_stake);

        // Emit the event
        event::emit(CircleCreatedEvent {
            id,
            creator: creator_addr,
            description,
            deadline,
            prize_pool,
        });
    }

    /// Opponent accepts the circle
    public entry fun accept_circle(
        opponent: &signer,
        circle_id: u64,
        opponent_supporter_pct: u8,
    ) acquires CircleBook {
        let opponent_addr = signer::address_of(opponent);
        let circle_book = borrow_global_mut<CircleBook>(@supercircle_addr);

        let mut i = 0;
        let len = vector::length(&circle_book.circles);
        let mut found = false;

        while (i < len) {
            let c = &mut vector::borrow_mut(&mut circle_book.circles, i);
            if (c.id == circle_id) {
                let opponent_stake = c.prize_pool/2;

                // Validations
                assert!(!c.resolved, ERR_CIRCLE_ALREADY_RESOLVED);
                assert!(c.opponent.is_none(), ERR_CIRCLE_OPPONENT_ALREADY_EXISTS);
                assert!(c.opponent_stake == 0, ERR_CIRCLE_OPPONENT_ALREADY_EXISTS); // not already accepted
                assert!(coin::balance<AptosCoin>(opponent_addr) >= opponent_stake, ERR_INSUFFICIENT_BALANCE);

                // Transfer the stake to the vault
                aptos_account::transfer(opponent, get_vault_addr(), opponent_stake);

                // Update the circle
                c.opponent_stake = opponent_stake;
                c.opponent_supporter_pct = opponent_supporter_pct;
                c.opponent = option::some(opponent_addr);
                c.status = 1u8; // Active
                found = true;

                // Emit the event
                event::emit(CircleAcceptedEvent {
                    id: c.id,
                    opponent: opponent_addr,
                    opponent_supporter_pct,
                });

                break;
            };
            i = i + 1;
        };
        assert!(found, ERR_CIRCLE_NOT_FOUND);
    }

    /// Supporter joins a circle
    public entry fun join_as_supporter(
        supporter: &signer,
        circle_id: u64,
        side: u8, // 0 = creator, 1 = opponent
        amount: u64,
    ) acquires CircleBook {
        let supporter_addr = signer::address_of(supporter);

        // Validations
        assert!(coin::balance<AptosCoin>(supporter_addr) >= amount, ERR_INSUFFICIENT_BALANCE);

        let circle_book = borrow_global_mut<CircleBook>(@supercircle_addr);

        let mut i = 0;
        let len = vector::length(&circle_book.circles);
        let mut found = false;

        while (i < len) {
            let c = &mut vector::borrow_mut(&mut circle_book.circles, i);

            if (c.id == circle_id) {
                assert!(!c.resolved, ERR_CIRCLE_ALREADY_RESOLVED);
                assert!(c.status != 2u8, ERR_CIRCLE_ALREADY_RESOLVED); // not resolved

                // Transfer the stake to the vault
                aptos_account::transfer(supporter, get_vault_addr(), amount);
                
                let supporter_struct = Supporter {
                    addr: supporter_addr,
                    amount,
                };
                
                if (side == 0u8) {
                    vector::push_back(&mut c.creator_supporters, supporter_struct);
                } else {
                    vector::push_back(&mut c.opponent_supporters, supporter_struct);
                }
                found = true;

                // Emit the event
                event::emit(CircleSupporterJoinedEvent {
                    id: c.id,
                    side,
                    amount,
                });

                break;
            };
            i = i + 1;
        };
        assert!(found, ERR_CIRCLE_NOT_FOUND);
    }

    /// Resolve the circle (only callable by AI signer)
    public entry fun resolve_circle(
        ai_signer: &signer,
        circle_id: u64,
        winner: address
    ) {
        // Only AI signer can call
        let ai_addr = signer::address_of(ai_signer);
        assert!(ai_addr == AI_SIGNER_ADDRESS, ERR_NOT_AI_SIGNER);

        let circle_book = borrow_global_mut<CircleBook>(@supercircle_addr);

        let mut i = 0;
        let len = vector::length(&circle_book.circles);
        let mut found = false;

        while (i < len) {
            let c = &mut vector::borrow_mut(&mut circle_book.circles, i);
            if (c.id == circle_id) {
                // Validations
                assert!(!c.resolved, ERR_CIRCLE_ALREADY_RESOLVED);
                assert!(c.status != 2u8, ERR_CIRCLE_ALREADY_RESOLVED); // not resolved

                c.resolved = true;
                c.status = 2u8; // Resolved
                c.winner = option::some(winner);

                // Determine winner and loser
                let (winner_supporters, winner_supporter_pct, winner_stake, loser_supporters, loser_supporter_pct, loser_stake, loser_addr, winner_side) =
                    if (c.creator == winner) {
                        (&c.creator_supporters, c.creator_supporter_pct, c.creator_stake, &c.opponent_supporters, c.opponent_supporter_pct, c.opponent_stake, option::borrow(&c.opponent).unwrap(), 0u8)
                    } else {
                        (&c.opponent_supporters, c.opponent_supporter_pct, c.opponent_stake, &c.creator_supporters, c.creator_supporter_pct, c.creator_stake, c.creator, 1u8)
                    };

                // Calculate and distribute winner's supporter share
                let mut total_winner_supporter_share = 0u64;
                let mut j = 0;
                let winner_supporters_len = vector::length(winner_supporters);

                while (j < winner_supporters_len) {
                    let s = &vector::borrow(winner_supporters, j);

                    total_winner_supporter_share = total_winner_supporter_share + s.amount;

                    // Transfer the supporter share to the vault
                    let supporter_share = s.amount * 2;
                    aptos_account::transfer(s.addr, get_vault_addr(), supporter_share);

                    j = j + 1;
                };

                let winner_calculated_share = c.prize_pool - total_winner_supporter_share;

                // Transfer the winner's share to the winner
                aptos_account::transfer(winner, winner, winner_calculated_share);

                // Transfer the loser's stake to the loser (if there supporter has staked)
                let loser_supporters_len = vector::length(loser_supporters);
                if (loser_supporters_len > 0) {
                    let mut k = 0;
                    let mut total_loser_supporter_share = 0u64;

                    while (k < loser_supporters_len) {
                        let s = &vector::borrow(loser_supporters, k);
                        total_loser_supporter_share = total_loser_supporter_share + s.amount;

                        k = k + 1;
                    };

                    aptos_account::transfer(loser, loser, loser_stake - total_loser_supporter_share);
                } // else, loser doesn't have any supporters....therefore, loser gets nothing
                found = true;
                break;
            };
            i = i + 1;
        };
        assert!(found, 2); // challenge not found
    }

    // ================================= View functions ================================== //

    public fun get_vault_addr(): address {
        object::create_object_address(&@supercircle_addr, VAULT_SEED)
    }

    /// Get the maximum amount of stake that a supporter can allocate to a side
    public fun get_supporter_max_alloc_amount(
        circle_id: u64,
        side: u8, // 0 = creator, 1 = opponent
    ): u64 {
        let circle_book = borrow_global<CircleBook>(@supercircle_addr);
        let circle = vector::borrow(&circle_book.circles, circle_id);

        let mut max_alloc_amount = 0u64;
        
        if (side == 0u8) {
            max_alloc_amount = circle.prize_pool * circle.creator_supporter_pct / 100;
        } else {
            max_alloc_amount = circle.prize_pool * circle.opponent_supporter_pct / 100;
        }

        max_alloc_amount
    }

    /// Get the remaining eligible supporter stake amount for a side
    public fun get_remaining_eligible_supporter_stake_amount(
        circle_id: u64,
        side: u8, // 0 = creator, 1 = opponent
    ): u64 {
        let circle_book = borrow_global<CircleBook>(@supercircle_addr);
        let circle = vector::borrow(&circle_book.circles, circle_id);

        let mut total_supporter_share = 0u64;
        let max_alloc_amount = get_supporter_max_alloc_amount(circle_id, side);
        
        if (side == 0u8) {
            let mut i = 0;
            let supporters_len = vector::length(&circle.creator_supporters);

            while (i < supporters_len) {
                let s = &vector::borrow(&circle.creator_supporters, i);

                total_supporter_share = total_supporter_share + s.amount;
                i = i + 1;
            };
        } else {
            let mut i = 0;
            let supporters_len = vector::length(&circle.opponent_supporters);

            while (i < supporters_len) {
                let s = &vector::borrow(&circle.opponent_supporters, i);
                total_supporter_share = total_supporter_share + s.amount;
                i = i + 1;
            };
        };

        max_alloc_amount - total_supporter_share
    }

    /// Check if the deadline has passed for a circle
    public fun is_deadline_passed(circle_id: u64): bool {
        let circle_book = borrow_global<CircleBook>(@supercircle_addr);
        let circle = vector::borrow(&circle_book.circles, circle_id);

        let now = timestamp::now_seconds();
        now > circle.deadline
    }

    // ================================= Unit Tests ================================== //

    #[test_only]
    use aptos_framework::account::create_account_for_test;

    #[test]
    public fun test_init() {
        let creator = account::create_account();
        SuperCircle_01::init(&creator);
    }

    #[test]
    public fun test_create_circle() {
        let creator = account::create_account();
        SuperCircle_01::init(&creator);

        // Mint coins and register
        coin::register<AptosCoin>(&creator);
        coin::mint<AptosCoin>(&creator, 100_000);

        SuperCircle_01::create_circle(
            &creator,
            string::utf8(b"First Challenge"),
            1_725_000_000,
            20,
            100_000
        );
    }

    #[test]
    public fun test_accept_circle() {
        let creator = account::create_account();
        let opponent = account::create_account();

        SuperCircle_01::init(&creator);

        coin::register<AptosCoin>(&creator);
        coin::register<AptosCoin>(&opponent);

        coin::mint<AptosCoin>(&creator, 100_000);
        coin::mint<AptosCoin>(&opponent, 100_000);

        SuperCircle_01::create_circle(
            &creator,
            string::utf8(b"Challenge"),
            1_725_000_000,
            10,
            100_000
        );

        SuperCircle_01::accept_circle(&opponent, 0, 15);
    }

    #[test]
    public fun test_join_as_supporter_creator_side() {
        let creator = account::create_account();
        let supporter = account::create_account();

        SuperCircle_01::init(&creator);

        coin::register<AptosCoin>(&creator);
        coin::register<AptosCoin>(&supporter);

        coin::mint<AptosCoin>(&creator, 100_000);
        coin::mint<AptosCoin>(&supporter, 50_000);

        SuperCircle_01::create_circle(
            &creator,
            string::utf8(b"Support me!"),
            1_725_000_000,
            25,
            100_000
        );

        SuperCircle_01::join_as_supporter(&supporter, 0, 0, 10_000);
    }

    #[test]
    public fun test_join_as_supporter_opponent_side() {
        let creator = account::create_account();
        let opponent = account::create_account();
        let supporter = account::create_account();

        SuperCircle_01::init(&creator);

        coin::register<AptosCoin>(&creator);
        coin::register<AptosCoin>(&opponent);
        coin::register<AptosCoin>(&supporter);

        coin::mint<AptosCoin>(&creator, 100_000);
        coin::mint<AptosCoin>(&opponent, 100_000);
        coin::mint<AptosCoin>(&supporter, 50_000);

        SuperCircle_01::create_circle(
            &creator,
            string::utf8(b"Epic Duel"),
            1_725_000_000,
            30,
            100_000
        );
        SuperCircle_01::accept_circle(&opponent, 0, 30);

        SuperCircle_01::join_as_supporter(&supporter, 0, 1, 15_000);
    }

    #[test]
    public fun test_get_remaining_eligible_supporter_stake() {
        let creator = account::create_account();
        let supporter = account::create_account();

        SuperCircle_01::init(&creator);

        coin::register<AptosCoin>(&creator);
        coin::register<AptosCoin>(&supporter);

        coin::mint<AptosCoin>(&creator, 100_000);
        coin::mint<AptosCoin>(&supporter, 50_000);

        SuperCircle_01::create_circle(
            &creator,
            string::utf8(b"Allocation Check"),
            1_725_000_000,
            50,
            100_000
        );

        let max_alloc = SuperCircle_01::get_supporter_max_alloc_amount(0, 0);
        assert!(max_alloc == 50_000, 100); // 50% of 100_000

        SuperCircle_01::join_as_supporter(&supporter, 0, 0, 20_000);

        let remaining = SuperCircle_01::get_remaining_eligible_supporter_stake_amount(0, 0);
        assert!(remaining == 30_000, 101);
    }

}
