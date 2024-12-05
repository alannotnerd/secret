#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("AsjZ3kWAUSQRNt2pZVeJkywhZ6gpLpHZmJjduPmKZDZZ");

#[program]
pub mod secret {
    use super::*;

  pub fn close(_ctx: Context<CloseSecret>) -> Result<()> {
    Ok(())
  }

  pub fn decrement(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.secret.count = ctx.accounts.secret.count.checked_sub(1).unwrap();
    Ok(())
  }

  pub fn increment(ctx: Context<Update>) -> Result<()> {
    ctx.accounts.secret.count = ctx.accounts.secret.count.checked_add(1).unwrap();
    Ok(())
  }

  pub fn initialize(_ctx: Context<InitializeSecret>) -> Result<()> {
    Ok(())
  }

  pub fn set(ctx: Context<Update>, value: u8) -> Result<()> {
    ctx.accounts.secret.count = value.clone();
    Ok(())
  }
}

#[derive(Accounts)]
pub struct InitializeSecret<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  init,
  space = 8 + Secret::INIT_SPACE,
  payer = payer
  )]
  pub secret: Account<'info, Secret>,
  pub system_program: Program<'info, System>,
}
#[derive(Accounts)]
pub struct CloseSecret<'info> {
  #[account(mut)]
  pub payer: Signer<'info>,

  #[account(
  mut,
  close = payer, // close account and return lamports to payer
  )]
  pub secret: Account<'info, Secret>,
}

#[derive(Accounts)]
pub struct Update<'info> {
  #[account(mut)]
  pub secret: Account<'info, Secret>,
}

#[account]
#[derive(InitSpace)]
pub struct Secret {
  count: u8,
}
