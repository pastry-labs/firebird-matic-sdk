import { Contract } from '@ethersproject/contracts'
import { getNetwork } from '@ethersproject/networks'
import { getDefaultProvider } from '@ethersproject/providers'
import { TokenAmount } from './entities/fractions/tokenAmount'
import { Pair } from './entities/pair'
import { abi as IUniswapV2Pair } from '@uniswap/v2-core/build/IUniswapV2Pair.json'
import invariant from 'tiny-invariant'
import ERC20 from '@uniswap/v2-core/build/ERC20.json'
import { ChainId } from './constants'
import { Token } from './entities/token'

let TOKEN_DECIMALS_CACHE: { [chainId: number]: { [address: string]: number } } = {
  [ChainId.MATIC]: {
    '0xE0B7927c4aF23765Cb51314A0E0521A9645F0E2A': 9 // DGD
  }
}

/**
 * Contains methods for constructing instances of pairs and tokens from on-chain data.
 */
export abstract class Fetcher {
  /**
   * Cannot be constructed.
   */
  private constructor() {}

  /**
   * Fetch information for a given token on the given chain, using the given ethers provider.
   * @param chainId chain of the token
   * @param address address of the token on the chain
   * @param provider provider used to fetch the token
   * @param symbol optional symbol of the token
   * @param name optional name of the token
   */
  public static async fetchTokenData(
      chainId: ChainId,
      address: string,
      provider = getDefaultProvider(getNetwork(chainId)),
      symbol?: string,
      name?: string
  ): Promise<Token> {
    const parsedDecimals =
        typeof TOKEN_DECIMALS_CACHE?.[chainId]?.[address] === 'number'
            ? TOKEN_DECIMALS_CACHE[chainId][address]
            : await new Contract(address, ERC20.abi, provider).decimals().then((decimals: number): number => {
              TOKEN_DECIMALS_CACHE = {
                ...TOKEN_DECIMALS_CACHE,
                [chainId]: {
                  ...TOKEN_DECIMALS_CACHE?.[chainId],
                  [address]: decimals
                }
              }
              return decimals
            })
    return new Token(chainId, address, parsedDecimals, symbol, name)
  }

  /**
   * Fetches information about a pair and constructs a pair from the given two tokens.
   * Note, Firebird pools can have a custom ratio and swap fees. You may need to
   * populate ratioA and swapFee if they differ from the default.
   * @param tokenA first token
   * @param provider the provider to use to fetch the data
   * @param tokenB second token
   * @param ratioA ratio of the first asset in the Pool. It is possible to have a pool
   * with the same assets but different weightings
   * @param swapFee It is possible to have a pool with the same assets but different swap fee
   */
  public static async fetchPairData(
      tokenA: Token,
      tokenB: Token,
      provider = getDefaultProvider(getNetwork(tokenA.chainId)),
      ratioA = 50,
      swapFee = 20
  ): Promise<Pair> {
    invariant(tokenA.chainId === tokenB.chainId, 'CHAIN_ID')
    const address = Pair.getAddress(tokenA, tokenB, ratioA, swapFee)
    let reserves0, reserves1
    try {
      [reserves0, reserves1] = await new Contract(address, IUniswapV2Pair, provider).getReserves()
    } catch (e) {
      throw new Error(`
        Could not get reserves. Please verify that this: ${address} is the pool you are looking for. 
        Also check swapFee and ratioA parameters (ratio: ${ratioA}, swapFee: ${swapFee})
      `)
    }
    const balances = tokenA.sortsBefore(tokenB) ? [reserves0, reserves1] : [reserves1, reserves0]
    return new Pair(new TokenAmount(tokenA, balances[0]), new TokenAmount(tokenB, balances[1]))
  }
}
