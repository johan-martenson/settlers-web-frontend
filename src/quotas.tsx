import React, { useEffect, useState } from "react"
import { HouseIcon } from "./icon"
import './quotas.css'
import { Button, Field, SelectTabData, SelectTabEvent, Tab, TabList } from "@fluentui/react-components"
import { Nation } from "./api/types"
import { Subtract16Filled, Add16Filled } from '@fluentui/react-icons'
import { monitor } from "./api/ws-api"
import { AmountBar } from "./amount_bar"

interface QuotasProps {
    nation: Nation

    onClose: (() => void)
}

const Quotas = ({ nation, onClose }: QuotasProps) => {
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
            const coalQuotas = await monitor.getCoalQuotas()

            setMintAmount(coalQuotas.mint)
            setArmoryCoalAmount(coalQuotas.armory)
            setIronSmelterAmount(coalQuotas.ironSmelter)
        })().then()

        return () => { }
    }, [])

    useEffect(() => {
        (async () => {
            const foodQuotas = await monitor.getFoodQuotas()

            setIronMineAmount(foodQuotas.ironMine)
            setCoalMineAmount(foodQuotas.coalMine)
            setGoldMineAmount(foodQuotas.goldMine)
            setGraniteMineAmount(foodQuotas.graniteMine)
        })().then()

        return () => { }
    }, [])

    useEffect(() => {
        (async () => {
            const wheatQuotas = await monitor.getWheatQuotas()

            setPigFarmWheatAmount(wheatQuotas.pigFarm)
            setDonkeyFarmWheatAmount(wheatQuotas.donkeyFarm)
            setMillAmount(wheatQuotas.mill)
            setBreweryWheatAmount(wheatQuotas.brewery)
        })().then()

        return () => { }
    }, [])

    useEffect(() => {
        (async () => {
            const waterQuotas = await monitor.getWaterQuotas()

            setBakeryAmount(waterQuotas.bakery)
            setDonkeyFarmWaterAmount(waterQuotas.donkeyFarm)
            setPigFarmWaterAmount(waterQuotas.pigFarm)
            setBreweryWaterAmount(waterQuotas.brewery)
        })().then()
    }, [])

    useEffect(() => {
        (async () => {
            const ironBarQuotas = await monitor.getIronBarQuotas()

            setArmoryIronBarAmount(ironBarQuotas.armory)
            setMetalworksIronBarAmount(ironBarQuotas.metalworks)
        })().then()
    }, [])

    useEffect(() => {
        monitor.setWaterQuotas(bakeryAmount, donkeyFarmWaterAmount, pigFarmWaterAmount, breweryWaterAmount)

        return () => { }
    }, [bakeryAmount, donkeyFarmWaterAmount, pigFarmWaterAmount, breweryWaterAmount])

    useEffect(() => {
        monitor.setCoalQuotas(mintAmount, armoryCoalAmount, ironSmelterAmount)

        return () => { }
    }, [mintAmount, armoryCoalAmount, ironSmelterAmount])

    useEffect(() => {
        monitor.setFoodQuotas(ironMineAmount, coalMineAmount, goldMineAmount, graniteMineAmount)

        return () => { }
    }, [ironMineAmount, coalMineAmount, goldMineAmount, graniteMineAmount])

    useEffect(() => {
        monitor.setWheatQuotas(donkeyFarmWheatAmount, pigFarmWheatAmount, millAmount, breweryWheatAmount)

        return () => { }
    }, [donkeyFarmWheatAmount, pigFarmWheatAmount, millAmount, breweryWheatAmount])

    useEffect(() => {
        monitor.setIronBarQuotas(armoryIronBarAmount, metalworksIronBarAmount)

        return () => { }
    }, [armoryIronBarAmount, metalworksIronBarAmount])

    return (
        <div className="quotas-window" onWheel={(event) => event.stopPropagation()}>

            <h1>Quotas</h1>

            <TabList
                defaultSelectedValue={materialToManage}
                onTabSelect={
                    (_event: SelectTabEvent, data: SelectTabData) => {
                        const value = data.value

                        if (value === 'COAL') {
                            setMaterialToManage('COAL')
                        } else if (value === 'WHEAT') {
                            setMaterialToManage('WHEAT')
                        } else if (value === 'WATER') {
                            setMaterialToManage('WATER')
                        } else if (value === 'PLANK') {
                            setMaterialToManage('PLANK')
                        } else if (value === 'FOOD') {
                            setMaterialToManage('FOOD')
                        } else if (value === 'IRON_BAR') {
                            setMaterialToManage('IRON_BAR')
                        }
                    }
                }
            >
                <Tab value={'COAL'}>Coal</Tab>
                <Tab value={'WHEAT'}>Wheat</Tab>
                <Tab value={'WATER'}>Water</Tab>
                <Tab value={'PLANK'}>Plank</Tab>
                <Tab value={'FOOD'}>Food</Tab>
                <Tab value={'IRON_BAR'}>Iron bars</Tab>
            </TabList>

            {materialToManage === 'COAL' &&
                <>
                    <Field label="Mint">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Mint" nation={nation} drawShadow />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setMintAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={mintAmount} max={10} />
                                <Add16Filled onClick={() => setMintAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Armory">
                        <div className="quota-for-house">
                            <HouseIcon houseType="Armory" nation={nation} drawShadow />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setArmoryCoalAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={armoryCoalAmount} max={10} />
                                <Add16Filled onClick={() => setArmoryCoalAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Iron smelter">
                        <div className="quota-for-house">
                            <HouseIcon houseType="IronSmelter" nation={nation} drawShadow />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setIronSmelterAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={ironSmelterAmount} max={10} />
                                <Add16Filled onClick={() => setIronSmelterAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'FOOD' &&
                <>

                    <Field label="Iron mine">
                        <div className="quota-for-house">
                            <HouseIcon houseType="IronMine" nation={nation} drawShadow />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setIronMineAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={ironMineAmount} max={10} />
                                <Add16Filled onClick={() => setIronMineAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Coal mine">
                        <div className="quota-for-house">
                            <HouseIcon houseType="CoalMine" nation={nation} drawShadow />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setCoalMineAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={coalMineAmount} max={10} />
                                <Add16Filled onClick={() => setCoalMineAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Gold mine">
                        <div className="quota-for-house">
                            <HouseIcon houseType="GoldMine" nation={nation} drawShadow />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setGoldMineAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={goldMineAmount} max={10} />
                                <Add16Filled onClick={() => setGoldMineAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Granite mine">
                        <div className="quota-for-house">
                            <HouseIcon houseType="GraniteMine" nation={nation} drawShadow />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setGraniteMineAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={graniteMineAmount} max={10} />
                                <Add16Filled onClick={() => setGraniteMineAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'WATER' &&
                <>
                    <Field label="Bakery">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Bakery" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setBakeryAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={bakeryAmount} max={10} />
                                <Add16Filled onClick={() => setBakeryAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Donkey farm">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="DonkeyFarm" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setDonkeyFarmWaterAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={donkeyFarmWaterAmount} max={10} />
                                <Add16Filled onClick={() => setDonkeyFarmWaterAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Pig farm">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Mint" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setPigFarmWaterAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={pigFarmWaterAmount} max={10} />
                                <Add16Filled onClick={() => setPigFarmWaterAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Brewery">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Brewery" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setBreweryWaterAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={breweryWaterAmount} max={10} />
                                <Add16Filled onClick={() => setBreweryWaterAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'PLANK' &&
                <>
                    <div>(not implemented yet)</div>
                    <Field label="Construction">
                        <div className="quota-for-house" >
                            <div>Construction</div>
                            <div className="quota">
                                <Subtract16Filled onClick={() => setConstructionAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={constructionAmount} max={10} />
                                <Add16Filled onClick={() => setConstructionAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Boats and ships">
                        <div className="quota-for-house" >
                            <div>Boats and ships</div>
                            <div className="quota">
                                <Subtract16Filled onClick={() => setBoatsAndShipsAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={boatsAndShipsAmount} max={10} />
                                <Add16Filled onClick={() => setBoatsAndShipsAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'WHEAT' &&
                <>
                    <Field label="Mill">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Mill" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setMillAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={millAmount} max={10} />
                                <Add16Filled onClick={() => setMillAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Donkey farm">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="DonkeyFarm" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setDonkeyFarmWheatAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={donkeyFarmWheatAmount} max={10} />
                                <Add16Filled onClick={() => setDonkeyFarmWheatAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Pig farm">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Mint" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setPigFarmWheatAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={pigFarmWheatAmount} max={10} />
                                <Add16Filled onClick={() => setPigFarmWheatAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Brewery">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Brewery" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setBreweryWheatAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={breweryWheatAmount} max={10} />
                                <Add16Filled onClick={() => setBreweryWheatAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'IRON_BAR' &&
                <>
                    <Field label="Armory">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Armory" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setArmoryIronBarAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={armoryIronBarAmount} max={10} />
                                <Add16Filled onClick={() => setArmoryIronBarAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Metalworks">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Metalworks" nation={nation} drawShadow />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setMetalworksIronBarAmount((previous) => Math.max(0, previous - 1))} />
                                <AmountBar amount={metalworksIronBarAmount} max={10} />
                                <Add16Filled onClick={() => setMetalworksIronBarAmount((previous) => Math.min(10, previous + 1))} />
                            </div>
                        </div>
                    </Field>
                </>
            }
            <Button onClick={() => onClose()} >Close</Button>
        </div>
    )
}

export { Quotas }