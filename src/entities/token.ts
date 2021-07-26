import invariant from 'tiny-invariant'
import { ChainId } from '../constants'
import { validateAndParseAddress } from '../utils'
import { Currency } from './currency'

/**
 * Represents an ERC20 token with a unique address and some metadata.
 */
export class Token extends Currency {
  public readonly chainId: ChainId
  public readonly address: string

  public constructor(chainId: ChainId, address: string, decimals: number, symbol?: string, name?: string) {
    super(decimals, symbol, name)
    this.chainId = chainId
    this.address = validateAndParseAddress(address)
  }

  /**
   * Returns true if the two tokens are equivalent, i.e. have the same chainId and address.
   * @param other other token to compare
   */
  public equals(other: Token): boolean {
    // short circuit on reference equality
    if (this === other) {
      return true
    }
    return this.chainId === other.chainId && this.address === other.address
  }

  /**
   * Returns true if the address of this token sorts before the address of the other token
   * @param other other token to compare
   * @throws if the tokens have the same address
   * @throws if the tokens are on different chains
   */
  public sortsBefore(other: Token): boolean {
    invariant(this.chainId === other.chainId, 'CHAIN_IDS')
    invariant(this.address !== other.address, 'ADDRESSES')
    return this.address.toLowerCase() < other.address.toLowerCase()
  }
}

/**
 * Compares two currencies for equality
 */
export function currencyEquals(currencyA: Currency, currencyB: Currency): boolean {
  if (currencyA instanceof Token && currencyB instanceof Token) {
    return currencyA.equals(currencyB)
  } else if (currencyA instanceof Token) {
    return false
  } else if (currencyB instanceof Token) {
    return false
  } else {
    return currencyA === currencyB
  }
}

export const WMATIC = {
  [ChainId.MATIC]: new Token(
    ChainId.MATIC,
    '0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270',
    18,
    'WMATIC',
    'Wrapped MATIC'
  ),
  [ChainId.MATICTESTNET]: new Token(
    ChainId.MATICTESTNET,
    '0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889',
    18,
    'WMATIC',
    'Wrapped MATIC'
  )
}

export const WETH = {
  [ChainId.MATIC]: new Token(
      ChainId.MATIC,
      '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      18,
      'WETH',
      'Wrapped ETH'
  ),
}

export const BNB = {
  [ChainId.BSC]: new Token(
      ChainId.BSC,
      '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
      18,
      'WBNB',
      'Wrapped BNB'
  ),
}

export const HOPE = {
  [ChainId.MATIC]: new Token(
      ChainId.MATIC,
      '0xd78c475133731cd54dadcb430f7aae4f03c1e660',
      18,
      'HOPE',
      'Firebird HOPE'
  ),
  [ChainId.BSC]: new Token(
      ChainId.MATIC,
      '0xd78C475133731CD54daDCb430F7aAE4F03C1E660',
      18,
      'HOPE-P',
      'Firebird HOPE-P'
  )
}