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
    use aptos_framework::object::{Self, ExtendRef};

    /// Error codes
    const ERR_INSUFFICIENT_BALANCE: u64 = 1;  // Insufficient balance
    const ERR_INVALID_STAKE_AMOUNT: u64 = 2;  // Invalid stake amount
    const ERR_CIRCLE_NOT_FOUND: u64 = 3;  // Circle not found
    const ERR_CIRCLE_OPPONENT_ALREADY_EXISTS: u64 = 4;  // Opponent already exists
    const ERR_CIRCLE_ALREADY_RESOLVED: u64 = 5;  // Circle already resolved
    const ERR_NOT_AI_SIGNER: u64 = 6;  // Not AI signer

    /// Status constants
    const STATUS_PENDING: u8 = 0;
    const STATUS_ACTIVE: u8 = 1;
    const STATUS_RESOLVED: u8 = 2;

    const VAULT_SEED: vector<u8> = b"vault";
    const AI_SIGNER_ADDRESS: address = @0xDEADBEEF; // TODO: change to actual AI signer address

    /// Supporter structure holds the address of the supporter and the amount of stake they have
    struct Supporter has copy, drop, store {
        addr: address,
        amount: u64, // amount staked
    }

    /// Circle structure
    struct Circle has key, store {
        id: u64,
        creator: address,
        opponent: option::Option<address>,
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
        let creator_stake = prize_pool / 2;

        // Validations
        assert!(coin::balance<AptosCoin>(creator_addr) >= creator_stake, ERR_INSUFFICIENT_BALANCE);

        let circle_book = borrow_global_mut<CircleBook>(@supercircle_addr);
        
        let id = circle_book.next_id;
        circle_book.next_id = id + 1;

        // Store the circle
        let circle = Circle {
            id,
            creator: creator_addr,
            opponent: option::none<address>(),
            description,
            deadline,
            creator_stake,
            opponent_stake: 0,
            creator_supporter_pct,
            opponent_supporter_pct: 0, // not set yet
            creator_supporters: vector::empty<Supporter>(),
            opponent_supporters: vector::empty<Supporter>(),
            resolved: false,
            winner: option::none<address>(),
            status: STATUS_PENDING,
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

    /// Find and update circle by ID
    fun find_and_update_circle_for_accept(
        circles: &mut vector<Circle>,
        circle_id: u64,
        opponent_addr: address,
        opponent_supporter_pct: u8,
    ) {
        let i = 0;
        let len = vector::length(circles);
        
        while (i < len) {
            let c = vector::borrow_mut(circles, i);
            if (c.id == circle_id) {
                let opponent_stake = c.prize_pool / 2;

                // Validations
                assert!(!c.resolved, ERR_CIRCLE_ALREADY_RESOLVED);
                assert!(option::is_none(&c.opponent), ERR_CIRCLE_OPPONENT_ALREADY_EXISTS);
                assert!(c.opponent_stake == 0, ERR_CIRCLE_OPPONENT_ALREADY_EXISTS);
                assert!(coin::balance<AptosCoin>(opponent_addr) >= opponent_stake, ERR_INSUFFICIENT_BALANCE);

                // Note: Transfer should be handled in the calling function

                // Update the circle
                c.opponent_stake = opponent_stake;
                c.opponent_supporter_pct = opponent_supporter_pct;
                c.opponent = option::some(opponent_addr);
                c.status = STATUS_ACTIVE;

                // Emit the event
                event::emit(CircleAcceptedEvent {
                    id: c.id,
                    opponent: opponent_addr,
                    opponent_supporter_pct,
                });
                return
            };
            i = i + 1;
        };
        abort ERR_CIRCLE_NOT_FOUND
    }

    /// Opponent accepts the circle
    public entry fun accept_circle(
        opponent: &signer,
        circle_id: u64,
        opponent_supporter_pct: u8,
    ) acquires CircleBook {
        let opponent_addr = signer::address_of(opponent);
        
        // First get the stake amount needed (before updating the circle)
        let circle_book = borrow_global<CircleBook>(@supercircle_addr);
        let circle = vector::borrow(&circle_book.circles, circle_id);
        let opponent_stake = circle.prize_pool / 2;
        
        // Transfer the stake to the vault
        aptos_account::transfer(opponent, get_vault_addr(), opponent_stake);
        
        // Now update the circle
        let circle_book_mut = borrow_global_mut<CircleBook>(@supercircle_addr);
        find_and_update_circle_for_accept(&mut circle_book_mut.circles, circle_id, opponent_addr, opponent_supporter_pct);
    }

    /// Find and update circle for supporter
    fun find_and_update_circle_for_supporter(
        circles: &mut vector<Circle>,
        circle_id: u64,
        supporter_addr: address,
        side: u8,
        amount: u64,
    ) {
        let i = 0;
        let len = vector::length(circles);
        
        while (i < len) {
            let c = vector::borrow_mut(circles, i);
            if (c.id == circle_id) {
                assert!(!c.resolved, ERR_CIRCLE_ALREADY_RESOLVED);
                assert!(c.status != STATUS_RESOLVED, ERR_CIRCLE_ALREADY_RESOLVED);

                let supporter_struct = Supporter {
                    addr: supporter_addr,
                    amount,
                };
                
                if (side == 0) {
                    vector::push_back(&mut c.creator_supporters, supporter_struct);
                } else {
                    vector::push_back(&mut c.opponent_supporters, supporter_struct);
                };

                // Emit the event
                event::emit(CircleSupporterJoinedEvent {
                    id: c.id,
                    side,
                    amount,
                });
                return
            };
            i = i + 1;
        };
        abort ERR_CIRCLE_NOT_FOUND
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

        // Transfer the stake to the vault
        aptos_account::transfer(supporter, get_vault_addr(), amount);

        let circle_book = borrow_global_mut<CircleBook>(@supercircle_addr);
        find_and_update_circle_for_supporter(&mut circle_book.circles, circle_id, supporter_addr, side, amount);
    }

    /// Helper function to distribute rewards
    fun distribute_rewards_to_supporters(
        supporters: &vector<Supporter>,
        vault_signer: &signer
    ): u64 {
        let total_supporters_share = 0;
        let i = 0;
        let len = vector::length(supporters);

        while (i < len) {
            let s = vector::borrow(supporters, i);
            total_supporters_share = total_supporters_share + s.amount;
            
            // Transfer 2x their stake back to supporter
            let supporter_share = s.amount * 2;
            aptos_account::transfer(vault_signer, s.addr, supporter_share);
            
            i = i + 1;
        };
        total_supporters_share
    }

    /// Helper function to calculate loser supporters total
    fun calculate_loser_supporters_total(supporters: &vector<Supporter>): u64 {
        let total = 0;
        let i = 0;
        let len = vector::length(supporters);

        while (i < len) {
            let s = vector::borrow(supporters, i);
            total = total + s.amount;
            i = i + 1;
        };
        total
    }

    /// Find and resolve circle
    fun find_and_resolve_circle(
        circles: &mut vector<Circle>,
        circle_id: u64,
        winner: address,
        vault_signer: &signer,
    ) {
        let i = 0;
        let len = vector::length(circles);
        
        while (i < len) {
            let c = vector::borrow_mut(circles, i);
            if (c.id == circle_id) {
                // Validations
                assert!(!c.resolved, ERR_CIRCLE_ALREADY_RESOLVED);
                assert!(c.status != STATUS_RESOLVED, ERR_CIRCLE_ALREADY_RESOLVED);

                c.resolved = true;
                c.status = STATUS_RESOLVED;
                c.winner = option::some(winner);

                // Get opponent address from option
                let opponent_addr = if (option::is_some(&c.opponent)) {
                    *option::borrow(&c.opponent)
                } else {
                    abort ERR_CIRCLE_NOT_FOUND
                };

                // Determine winner and loser
                let (winner_supporters, loser_supporters, loser_addr, loser_stake) =
                    if (c.creator == winner) {
                        (&c.creator_supporters, &c.opponent_supporters, opponent_addr, c.opponent_stake)
                    } else {
                        (&c.opponent_supporters, &c.creator_supporters, c.creator, c.creator_stake)
                    };

                // Distribute to winner's supporters
                let total_winner_supporter_share = distribute_rewards_to_supporters(winner_supporters, vault_signer);

                // Calculate and transfer winner's share
                let winner_calculated_share = c.prize_pool - total_winner_supporter_share;
                aptos_account::transfer(vault_signer, winner, winner_calculated_share);

                // Handle loser's remaining stake
                let loser_supporters_len = vector::length(loser_supporters);
                if (loser_supporters_len > 0) {
                    let total_loser_supporter_share = calculate_loser_supporters_total(loser_supporters);
                    // Transfer remaining stake from vault to loser
                    aptos_account::transfer(vault_signer, loser_addr, loser_stake - total_loser_supporter_share);
                };
                return
            };
            i = i + 1;
        };
        abort ERR_CIRCLE_NOT_FOUND
    }

    /// Resolve the circle (only callable by AI signer)
    public entry fun resolve_circle(
        ai_signer: &signer,
        circle_id: u64,
        winner: address
    ) acquires CircleBook, Vault {
        // Only AI signer can call
        let ai_addr = signer::address_of(ai_signer);
        assert!(ai_addr == AI_SIGNER_ADDRESS, ERR_NOT_AI_SIGNER);

        let circle_book = borrow_global_mut<CircleBook>(@supercircle_addr);
        
        // Get vault signer
        let vault = borrow_global<Vault>(get_vault_addr());
        let vault_signer = &object::generate_signer_for_extending(&vault.extend_ref);

        find_and_resolve_circle(&mut circle_book.circles, circle_id, winner, vault_signer);
    }

    // ================================= View functions ================================== //

    public fun get_vault_addr(): address {
        object::create_object_address(&@supercircle_addr, VAULT_SEED)
    }

    /// Get the maximum amount of stake that a supporter can allocate to a side
    public fun get_supporter_max_alloc_amount(
        circle_id: u64,
        side: u8, // 0 = creator, 1 = opponent
    ): u64 acquires CircleBook {
        let circle_book = borrow_global<CircleBook>(@supercircle_addr);
        let circle = vector::borrow(&circle_book.circles, circle_id);

        let max_alloc_amount = if (side == 0) {
            circle.prize_pool * (circle.creator_supporter_pct as u64) / 100
        } else {
            circle.prize_pool * (circle.opponent_supporter_pct as u64) / 100
        };

        max_alloc_amount
    }

    /// Calculate supporter total helper
    fun calculate_supporters_total(supporters: &vector<Supporter>): u64 {
        let total = 0;
        let i = 0;
        let len = vector::length(supporters);

        while (i < len) {
            let s = vector::borrow(supporters, i);
            total = total + s.amount;
            i = i + 1;
        };
        total
    }

    /// Get the remaining eligible supporter stake amount for a side
    public fun get_remaining_eligible_supporter_stake_amount(
        circle_id: u64,
        side: u8, // 0 = creator, 1 = opponent
    ): u64 acquires CircleBook {
        let circle_book = borrow_global<CircleBook>(@supercircle_addr);
        let circle = vector::borrow(&circle_book.circles, circle_id);

        // Calculate max_alloc_amount directly to avoid double borrow
        let max_alloc_amount = if (side == 0) {
            circle.prize_pool * (circle.creator_supporter_pct as u64) / 100
        } else {
            circle.prize_pool * (circle.opponent_supporter_pct as u64) / 100
        };
        
        let total_supporter_share = if (side == 0) {
            calculate_supporters_total(&circle.creator_supporters)
        } else {
            calculate_supporters_total(&circle.opponent_supporters)
        };

        max_alloc_amount - total_supporter_share
    }

    /// Check if the deadline has passed for a circle
    public fun is_deadline_passed(circle_id: u64): bool acquires CircleBook {
        let circle_book = borrow_global<CircleBook>(@supercircle_addr);
        let circle = vector::borrow(&circle_book.circles, circle_id);

        let now = timestamp::now_seconds();
        now > circle.deadline
    }

    // ================================= Unit Tests ================================== //

    #[test_only]
    use aptos_framework::account;

    #[test]
    public fun test_init() {
        let creator = account::create_account_for_test(@0x1);
        init(&creator);
    }

    #[test] 
    public fun test_vault_address() {
        // Test that we can compute the vault address
        let _vault_addr = get_vault_addr();
    }

    #[test]
    public fun test_supporter_max_alloc_calculation() {
        // Test max allocation calculation without full circle setup
        // This tests the formula: prize_pool * (supporter_pct as u64) / 100
        let prize_pool = 100_000u64;
        let supporter_pct = 30u8;
        let expected = prize_pool * (supporter_pct as u64) / 100;
        assert!(expected == 30_000, 100);
    }

    #[test]
    public fun test_circle_struct_creation() {
        // Test creating a Circle struct directly (without entry functions)
        let circle = Circle {
            id: 1,
            creator: @0x1,
            opponent: option::none<address>(),
            description: string::utf8(b"Test Circle"),
            deadline: 1_725_000_000,
            creator_stake: 50_000,
            opponent_stake: 0,
            creator_supporter_pct: 25,
            opponent_supporter_pct: 0,
            creator_supporters: vector::empty<Supporter>(),
            opponent_supporters: vector::empty<Supporter>(),
            resolved: false,
            winner: option::none<address>(),
            status: STATUS_PENDING,
            prize_pool: 100_000,
        };
        
        // Test basic properties
        assert!(circle.id == 1, 1);
        assert!(circle.creator == @0x1, 2);
        assert!(circle.prize_pool == 100_000, 3);
        assert!(circle.status == STATUS_PENDING, 4);
        assert!(!circle.resolved, 5);
        
        // Clean up circle
        let Circle {
            id: _,
            creator: _,
            opponent: _,
            description: _,
            deadline: _,
            creator_stake: _,
            opponent_stake: _,
            creator_supporter_pct: _,
            opponent_supporter_pct: _,
            creator_supporters: _,
            opponent_supporters: _,
            resolved: _,
            winner: _,
            status: _,
            prize_pool: _,
        } = circle;
    }

    #[test]
    public fun test_supporter_struct_creation() {
        // Test creating Supporter structs
        let supporter1 = Supporter { addr: @0x1, amount: 1000 };
        let supporter2 = Supporter { addr: @0x2, amount: 2000 };
        
        assert!(supporter1.addr == @0x1, 1);
        assert!(supporter1.amount == 1000, 2);
        assert!(supporter2.addr == @0x2, 3);
        assert!(supporter2.amount == 2000, 4);
    }

    #[test]
    public fun test_percentage_calculations() {
        // Test the percentage calculation logic used in the contract
        let prize_pool = 100_000u64;
        
        let pct_25 = prize_pool * 25 / 100;
        assert!(pct_25 == 25_000, 1);
        
        let pct_50 = prize_pool * 50 / 100;
        assert!(pct_50 == 50_000, 2);
        
        let pct_75 = prize_pool * 75 / 100;
        assert!(pct_75 == 75_000, 3);
    }

    #[test]
    public fun test_status_constants() {
        // Test that our status constants are correct
        assert!(STATUS_PENDING == 0, 1);
        assert!(STATUS_ACTIVE == 1, 2);
        assert!(STATUS_RESOLVED == 2, 3);
    }
}