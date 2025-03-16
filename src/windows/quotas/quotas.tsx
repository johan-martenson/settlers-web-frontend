import React, { useEffect, useState } from 'react'
import { HouseIcon } from '../../icons/icon'
import './quotas.css'
import { Field, SelectTabData, SelectTabEvent, Tab, TabList } from '@fluentui/react-components'
import { Nation } from '../../api/types'
import { Subtract16Filled, Add16Filled } from '@fluentui/react-icons'
import { api } from '../../api/ws-api'
import { Window } from '../../components/dialog'

// Types
type QuotasProps = {
    nation: Nation

    onRaise: () => void
    onClose: () => void
}

// React components
const Quotas = ({ nation, onClose, onRaise }: QuotasProps) => {
    const [hover, setHover] = useState<string>()
    const [materialToManage, setMaterialToManage] = useState<'COAL' | 'WHEAT' | 'WATER' | 'PLANK' | 'FOOD' | 'IRON_BAR'>('COAL')
    const [mintAmount, setMintAmount] = useState<number>(5)
    const [armoryCoalAmount, setArmoryCoalAmount] = useState<number>(5)
    const [ironSmelterAmount, setIronSmelterAmount] = useState<number>(5)
    const [ironMineAmount, setIronMineAmount] = useState<number>(5)
    const [coalMineAmount, setCoalMineAmount] = useState<number>(5)
    const [goldMineAmount, setGoldMineAmount] = useState<number>(5)
    const [graniteMineAmount, setGraniteMineAmount] = useState<number>(5)
    const [bakeryAmount, setBakeryAmount] = useState<number>(5)
    const [pigFarmWaterAmount, setPigFarmWaterAmount] = useState<number>(5)
    const [donkeyFarmWaterAmount, setDonkeyFarmWaterAmount] = useState<number>(5)
    const [millAmount, setMillAmount] = useState<number>(5)
    const [donkeyFarmWheatAmount, setDonkeyFarmWheatAmount] = useState<number>(5)
    const [pigFarmWheatAmount, setPigFarmWheatAmount] = useState<number>(5)
    const [constructionAmount, setConstructionAmount] = useState<number>(5)
    const [boatsAndShipsAmount, setBoatsAndShipsAmount] = useState<number>(5)
    const [breweryWaterAmount, setBreweryWaterAmount] = useState<number>(5)
    const [breweryWheatAmount, setBreweryWheatAmount] = useState<number>(5)
    const [metalworksIronBarAmount, setMetalworksIronBarAmount] = useState<number>(5)
    const [armoryIronBarAmount, setArmoryIronBarAmount] = useState<number>(5)

    useEffect(() => {
        (async () => {
            const coalQuotas = await api.getCoalQuotas()

            setMintAmount(coalQuotas.mint)
            setArmoryCoalAmount(coalQuotas.armory)
            setIronSmelterAmount(coalQuotas.ironSmelter)
        })()
    }, [])

    useEffect(() => {
        (async () => {
            const foodQuotas = await api.getFoodQuotas()

            setIronMineAmount(foodQuotas.ironMine)
            setCoalMineAmount(foodQuotas.coalMine)
            setGoldMineAmount(foodQuotas.goldMine)
            setGraniteMineAmount(foodQuotas.graniteMine)
        })()
    }, [])

    useEffect(() => {
        (async () => {
            const wheatQuotas = await api.getWheatQuotas()

            setPigFarmWheatAmount(wheatQuotas.pigFarm)
            setDonkeyFarmWheatAmount(wheatQuotas.donkeyFarm)
            setMillAmount(wheatQuotas.mill)
            setBreweryWheatAmount(wheatQuotas.brewery)
        })()
    }, [])

    useEffect(() => {
        (async () => {
            const waterQuotas = await api.getWaterQuotas()

            setBakeryAmount(waterQuotas.bakery)
            setDonkeyFarmWaterAmount(waterQuotas.donkeyFarm)
            setPigFarmWaterAmount(waterQuotas.pigFarm)
            setBreweryWaterAmount(waterQuotas.brewery)
        })()
    }, [])

    useEffect(() => {
        (async () => {
            const ironBarQuotas = await api.getIronBarQuotas()

            setArmoryIronBarAmount(ironBarQuotas.armory)
            setMetalworksIronBarAmount(ironBarQuotas.metalworks)
        })()
    }, [])

    useEffect(() => {
        api.setWaterQuotas(bakeryAmount, donkeyFarmWaterAmount, pigFarmWaterAmount, breweryWaterAmount)
    }, [bakeryAmount, donkeyFarmWaterAmount, pigFarmWaterAmount, breweryWaterAmount])

    useEffect(() => {
        api.setCoalQuotas(mintAmount, armoryCoalAmount, ironSmelterAmount)
    }, [mintAmount, armoryCoalAmount, ironSmelterAmount])

    useEffect(() => {
        api.setFoodQuotas(ironMineAmount, coalMineAmount, goldMineAmount, graniteMineAmount)
    }, [ironMineAmount, coalMineAmount, goldMineAmount, graniteMineAmount])

    useEffect(() => {
        api.setWheatQuotas(donkeyFarmWheatAmount, pigFarmWheatAmount, millAmount, breweryWheatAmount)
    }, [donkeyFarmWheatAmount, pigFarmWheatAmount, millAmount, breweryWheatAmount])

    useEffect(() => {
        api.setIronBarQuotas(armoryIronBarAmount, metalworksIronBarAmount)
    }, [armoryIronBarAmount, metalworksIronBarAmount])

    return (
        <Window className='quotas-window' heading='Quotas' onClose={onClose} onRaise={onRaise} hoverInfo={hover}>

            <TabList
                defaultSelectedValue={materialToManage}
                onTabSelect={(_event: SelectTabEvent, data: SelectTabData) => {
                    const value = data.value as typeof materialToManage
                    setMaterialToManage(value)
                }}
            >
                <Tab
                    value={'COAL'}
                    onMouseEnter={() => setHover('Manage coal quotas')}
                    onMouseLeave={() => setHover(undefined)}
                >Coal</Tab>
                <Tab
                    value={'WHEAT'}
                    onMouseEnter={() => setHover('Manage wheat quotas')}
                    onMouseLeave={() => setHover(undefined)}
                >Wheat</Tab>
                <Tab
                    value={'WATER'}
                    onMouseEnter={() => setHover('Manage water quotas')}
                    onMouseLeave={() => setHover(undefined)}
                >Water</Tab>
                <Tab
                    value={'PLANK'}
                    onMouseEnter={() => setHover('Manage plank quotas')}
                    onMouseLeave={() => setHover(undefined)}
                >Plank</Tab>
                <Tab
                    value={'FOOD'}
                    onMouseEnter={() => setHover('Manage food quotas')}
                    onMouseLeave={() => setHover(undefined)}
                >Food</Tab>
                <Tab
                    value={'IRON_BAR'}
                    onMouseEnter={() => setHover('Manage iron quotas')}
                    onMouseLeave={() => setHover(undefined)}
                >Iron bars</Tab>
            </TabList>

            {materialToManage === 'COAL' &&
                <>
                    <Field label='Mint'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='Mint'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Mint')}
                                onMouseLeave={() => setHover(undefined)}
                            />

                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setMintAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease mint quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={mintAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${mintAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setMintAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase mint quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>

                    <Field label='Armory'>
                        <div className='quota-for-house'>
                            <HouseIcon
                                houseType='Armory'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Armory')}
                                onMouseLeave={() => setHover(undefined)}
                            />

                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setArmoryCoalAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease armory quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={armoryCoalAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${armoryCoalAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setArmoryCoalAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase armory quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>

                    <Field label='Iron smelter'>
                        <div className='quota-for-house'>
                            <HouseIcon
                                houseType='IronSmelter'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Iron smelter')}
                                onMouseLeave={() => setHover(undefined)}
                            />

                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setIronSmelterAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease iron smelter quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={ironSmelterAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${ironSmelterAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setIronSmelterAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase iron smelter quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'FOOD' &&
                <>

                    <Field label='Iron mine'>
                        <div className='quota-for-house'>
                            <HouseIcon
                                houseType='IronMine'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Iron mine')}
                                onMouseLeave={() => setHover(undefined)}
                            />

                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setIronMineAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease iron mine quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={ironMineAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${ironMineAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setIronMineAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase iron mine quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>

                    <Field label='Coal mine'>
                        <div className='quota-for-house'>
                            <HouseIcon
                                houseType='CoalMine'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Coal mine')}
                                onMouseLeave={() => setHover(undefined)}
                            />

                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setCoalMineAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease coal mine quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={coalMineAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${coalMineAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setCoalMineAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase coal mine quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>

                    <Field label='Gold mine'>
                        <div className='quota-for-house'>
                            <HouseIcon
                                houseType='GoldMine'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Gold mine')}
                                onMouseLeave={() => setHover(undefined)}
                            />

                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setGoldMineAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease gold mine quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={goldMineAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${goldMineAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setGoldMineAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase gold mine quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>

                    <Field label='Granite mine'>
                        <div className='quota-for-house'>
                            <HouseIcon
                                houseType='GraniteMine'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Granite mine')}
                                onMouseLeave={() => setHover(undefined)}
                            />

                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setGraniteMineAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease granite mine quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={graniteMineAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${graniteMineAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setGraniteMineAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase granite mine quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'WATER' &&
                <>
                    <Field label='Bakery'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='Bakery'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Bakery')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setBakeryAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease bakery quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={bakeryAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${bakeryAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setBakeryAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase bakery quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                    <Field label='Donkey farm'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='DonkeyFarm'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Donkey farm')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setDonkeyFarmWaterAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease donkey farm water quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={donkeyFarmWaterAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${donkeyFarmWaterAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setDonkeyFarmWaterAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase donkey farm water quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                    <Field label='Pig farm'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='PigFarm'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Mint')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setPigFarmWaterAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease pig farm water quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={pigFarmWaterAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${pigFarmWaterAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setPigFarmWaterAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase pig farm water quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                    <Field label='Brewery'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='Brewery'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Brewer')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setBreweryWaterAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease brewery water quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={breweryWaterAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${breweryWaterAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setBreweryWaterAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase brewery water quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'PLANK' &&
                <>
                    <div>(not implemented yet)</div>
                    <Field label='Construction'>
                        <div className='quota-for-house' >
                            <div>Construction</div>
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setConstructionAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease construction quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={constructionAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${constructionAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setConstructionAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase construction quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                    <Field label='Boats and ships'>
                        <div className='quota-for-house' >
                            <div>Boats and ships</div>
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setBoatsAndShipsAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease boat and ship building quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={boatsAndShipsAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${boatsAndShipsAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setBoatsAndShipsAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase boat and ship building quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'WHEAT' &&
                <>
                    <Field label='Mill'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='Mill'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Mill')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setMillAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease mill quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={millAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${millAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setMillAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase mill quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                    <Field label='Donkey farm'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='DonkeyFarm'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Donkey farm')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setDonkeyFarmWheatAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease donkey farm wheat quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={donkeyFarmWheatAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${donkeyFarmWheatAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setDonkeyFarmWheatAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase donkey farm wheat quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                    <Field label='Pig farm'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='PigFarm'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Pig farm')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setPigFarmWheatAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease pig farm wheat quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={pigFarmWheatAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${pigFarmWheatAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setPigFarmWheatAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase pig farm wheat quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                    <Field label='Brewery'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='Brewery'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Brewery')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setBreweryWheatAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease brewery wheat quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={breweryWheatAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${breweryWheatAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setBreweryWheatAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase brewery wheat quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'IRON_BAR' &&
                <>
                    <Field label='Armory'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='Armory'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Armory')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setArmoryIronBarAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease armory iron bar quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={armoryIronBarAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${armoryIronBarAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setArmoryIronBarAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase armory iron bar quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                    <Field label='Metalworks'>
                        <div className='quota-for-house' >
                            <HouseIcon
                                houseType='Metalworks'
                                nation={nation}
                                drawShadow
                                onMouseEnter={() => setHover('Metalworks')}
                                onMouseLeave={() => setHover(undefined)}
                            />
                            <div className='quota'>
                                <Subtract16Filled
                                    onClick={() => setMetalworksIronBarAmount((previous) => Math.max(0, previous - 1))}
                                    onMouseEnter={() => setHover('Decrease metalworks iron bar quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <meter
                                    value={metalworksIronBarAmount}
                                    min={0}
                                    max={10}
                                    onMouseEnter={() => setHover(`${metalworksIronBarAmount} / 10`)}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                                <Add16Filled
                                    onClick={() => setMetalworksIronBarAmount((previous) => Math.min(10, previous + 1))}
                                    onMouseEnter={() => setHover('Increase metalworks iron bar quota')}
                                    onMouseLeave={() => setHover(undefined)}
                                />
                            </div>
                        </div>
                    </Field>
                </>
            }
        </Window>
    )
}

export { Quotas }