use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer as SplTransfer};

// This is your program's public key and it will update
// automatically when you build the project.
declare_id!("8T2AWc9GbwRMduh8Ev6oJUZqHrsQnM4eDSvqcV8fDQnS");

#[program]
mod hello_anchor {
    use super::*;
    //Create program wallet
    pub fn create_nft_wallet(_ctx: Context<CreateNFTWallet>) -> Result<()> {
        msg!("NFT wallet created");
        Ok(())
    }

    //Create nft token account
    pub fn create_nft_token_account(_ctx: Context<CreateTokenAccount>) -> Result<()> {
        msg!("NFT token account created");
        Ok(())
    }

    //Create user nft token account
    pub fn create_user_nft_token_account(_ctx: Context<CreateUserTokenAccount>) -> Result<()> {
        msg!("User NFT token account created");
        Ok(())
    }

    //Create nft sell account
    pub fn create_nft_sell_account(ctx: Context<SellAcccount>, price: u64) -> Result<()> {
        let user = &ctx.accounts.signer;
        let user_ata = &ctx.accounts.user_ata;

        let destination = &ctx.accounts.program_ata;
        let token_program = &ctx.accounts.token_program;

        //Check user has NFT
        let user_amount: u64 = ctx.accounts.user_ata.amount;
        msg!("User balance {}", user_amount);
        if user_amount < 1 {
            return err!(NFTError::InsufficientBalance);
        }
        //Transfer NFT from user
        let cpi_accounts = SplTransfer {
            from: user_ata.to_account_info().clone(),
            to: destination.to_account_info().clone(),
            authority: user.to_account_info().clone(),
        };
        let cpi_program = token_program.to_account_info();

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), 1)?;
        let account_data = &mut ctx.accounts.sell_request;
        let clock = Clock::get()?;

        // Adding selling details
        account_data.owner_account = *ctx.accounts.signer.key;
        account_data.price = price;
        account_data.token_account = ctx.accounts.mint.key();
        account_data.timestamp = clock.unix_timestamp as u64;
        msg!("NFT sell account created");
        Ok(())
    }

    //Withdraw nft sell request
    pub fn withdraw_nft_sell_account(ctx: Context<SellAcccountWithdraw>, bump: u8) -> Result<()> {
        //Check user has NFT
        let user = &ctx.accounts.signer.key();
        let owner = ctx.accounts.user_ata.owner;
        msg!("User balance {}", owner);
        if owner.to_string() != user.to_string() {
            return err!(NFTError::InvalidUser);
        }
        //Transfer NFT from user
        let bump_vector = bump.to_le_bytes();
        let inner = vec![b"wallet".as_ref(), bump_vector.as_ref()];
        let outer = vec![inner.as_slice()];

        //trnafer funds,
        let transfer_instruction = SplTransfer {
            from: ctx.accounts.program_ata.to_account_info(),
            to: ctx.accounts.user_ata.to_account_info(),
            authority: ctx.accounts.program_wallet.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            outer.as_slice(),
        );
        anchor_spl::token::transfer(cpi_ctx, 1)?;
        msg!("NFT sell account created");
        Ok(())
    }

    //re-sell nft sell account
    pub fn resell_nft_sell_account(ctx: Context<SellAcccountWithdraw>, price: u64) -> Result<()> {
        let user = &ctx.accounts.signer;
        let user_ata = &ctx.accounts.user_ata;

        let destination = &ctx.accounts.program_ata;
        let token_program = &ctx.accounts.token_program;

        //Check user has NFT
        let user_amount: u64 = ctx.accounts.user_ata.amount;
        msg!("User balance {}", user_amount);
        if user_amount < 1 {
            return err!(NFTError::InsufficientBalance);
        }
        //Transfer NFT from user
        let cpi_accounts = SplTransfer {
            from: user_ata.to_account_info().clone(),
            to: destination.to_account_info().clone(),
            authority: user.to_account_info().clone(),
        };
        let cpi_program = token_program.to_account_info();

        token::transfer(CpiContext::new(cpi_program, cpi_accounts), 1)?;
        let account_data = &mut ctx.accounts.sell_request;
        let clock = Clock::get()?;

        // Adding selling details
        account_data.owner_account = *ctx.accounts.signer.key;
        account_data.price = price;
        account_data.token_account = ctx.accounts.mint.key();
        account_data.timestamp = clock.unix_timestamp as u64;
        msg!("NFT sell account updated");
        Ok(())
    }

    //Buy nft account
    pub fn buy_nft(ctx: Context<BuyNFT>, bump: u8) -> Result<()> {
        let account_data = &mut ctx.accounts.sell_request;

        if ctx.accounts.owner_account.key().to_string() != account_data.owner_account.to_string() {
            return err!(NFTError::InvalidOwner);
        }

        // Invoke the transfer SOL instruction
        let ix = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.signer.key(),
            &ctx.accounts.owner_account.key(),
            account_data.price,
        );

        // Perform the transfer
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                ctx.accounts.signer.to_account_info(),
                ctx.accounts.owner_account.to_account_info(),
            ],
        )?;

        let bump_vector = bump.to_le_bytes();
        let inner = vec![b"wallet".as_ref(), bump_vector.as_ref()];
        let outer = vec![inner.as_slice()];

        //trnafer funds,
        let transfer_instruction = SplTransfer {
            from: ctx.accounts.program_ata.to_account_info(),
            to: ctx.accounts.user_ata.to_account_info(),
            authority: ctx.accounts.program_wallet.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            transfer_instruction,
            outer.as_slice(),
        );
        anchor_spl::token::transfer(cpi_ctx, 1)?;
        msg!("NFT sell account updated");
        Ok(())
    }

}

#[derive(Accounts)]
pub struct CreateNFTWallet<'info> {
    #[account(init, payer = signer, seeds=[b"wallet".as_ref()], bump, space = 8 + WalletAccount::INIT_SPACE)]
    pub program_wallet: Account<'info, WalletAccount>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct WalletAccount {}

#[derive(Accounts)]
pub struct CreateTokenAccount<'info> {
    #[account(
        init,
        seeds = [mint.key().as_ref()],
        bump,
        payer = signer,
        token::mint = mint,
        token::authority = program_wallet,
     )]
    pub program_token_account: Account<'info, TokenAccount>,
    pub program_wallet: Account<'info, WalletAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct SellAcccount<'info> {
    #[account(mut)]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub program_ata: Account<'info, TokenAccount>,

    #[account(init, payer = signer, seeds=[b"sell".as_ref(), signer.key().as_ref(), mint.key().as_ref()], bump, space = 8 + SellAccount::INIT_SPACE,)]
    pub sell_request: Account<'info, SellAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}
#[account]
#[derive(InitSpace)]
pub struct SellAccount {
    pub owner_account: Pubkey,
    pub token_account: Pubkey,
    pub price: u64,
    pub timestamp: u64,
}

#[derive(Accounts)]
pub struct SellAcccountWithdraw<'info> {
    #[account(mut)]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub program_ata: Account<'info, TokenAccount>,
    pub program_wallet: Account<'info, WalletAccount>,
    #[account(mut)]
    pub sell_request: Account<'info, SellAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct BuyNFT<'info> {
    #[account(mut)]
    pub user_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub program_ata: Account<'info, TokenAccount>,

    #[account(mut)]
    pub sell_request: Account<'info, SellAccount>,
    pub mint: Account<'info, Mint>,
    pub program_wallet: Account<'info, WalletAccount>,
    #[account(mut)]
    pub owner_account: AccountInfo<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct CreateUserTokenAccount<'info> {
    #[account(
        init_if_needed,
        payer = signer, 
        associated_token::mint = mint, 
        associated_token::authority = signer
    )]
    pub token_account: Account<'info, TokenAccount>,
    pub mint: Account<'info, Mint>,
    #[account(mut)]
    pub signer: Signer<'info>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

//Error messages
#[error_code]
pub enum NFTError {
    #[msg("INVALID_OWNER: Invalid owner")]
    InvalidOwner,
    #[msg("INVALID_USER: It's not your NFT")]
    InvalidUser,
    #[msg("INVALID_MOVE: Position already taken")]
    InvalidMove,
    #[msg("INVALID_GAME: Game already finished")]
    InvalidGame,
    #[msg("INVALID_INSUFFICIENT_BALANCE: Gamers doesn't have enough balance to play the game")]
    InsufficientBalance,
}
