# BEN2 canonical parity fixtures

These deterministic procedural fixtures are the four canonical inputs selected by the focused BEN2 evidence. The PNG files contain no external image material. The procedural source material is dedicated under CC0-1.0; the original declaration and generator provenance are recorded in `/tmp/squoosh-ben2-mac-parity-regeneration/retained-reference/{LICENSE.generated-fixtures.txt,PROVENANCE.md}` in the approved evidence set.

The alpha files are byte-per-pixel outputs from the public `@huggingface/transformers` 4.2.0 `pipeline('background-removal')` reference path using immutable BEN2 model revision `c552aa82688edce09f0ac9d2e31ad53d9d629010`. They are semantic parity authorities, not runtime assets.

| File                                            | Evidence source                                           |   Bytes | SHA-256                                                            |
| ----------------------------------------------- | --------------------------------------------------------- | ------: | ------------------------------------------------------------------ |
| `procedural-rgb-640x360.png`                    | `normal-path-parity-v1/cases/rgb/fixture.png`             | 649,053 | `affb54b1f43a08f20c55bed157bbfebfd1ff01b9f41b57479f4093368c0b0cfa` |
| `procedural-rgb-640x360-transformers-alpha.u8`  | `normal-path-parity-v1/cases/rgb/authoritative-alpha.u8`  | 230,400 | `8b3f6d9973dd76eb6ef469b1c76d7d69b6e585bd3842c7e733e01d472ae2dfb7` |
| `procedural-rgba-333x517.png`                   | `normal-path-parity-v1/cases/rgba/fixture.png`            | 622,722 | `0cef624b6c4baba86d574a2bd77db6020d9bd670c24f7c568510398d2d436216` |
| `procedural-rgba-333x517-transformers-alpha.u8` | `normal-path-parity-v1/cases/rgba/authoritative-alpha.u8` | 172,161 | `31e364ad0d88b6b4f88b50f335c6810279e6e5684591e7c5866f4d8a0d302731` |

Do not regenerate or update these files as part of normal testing.
