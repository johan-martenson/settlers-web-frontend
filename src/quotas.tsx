import { useEffect, useState } from "react"
import { HouseIcon, InventoryIcon } from "./icon"
import './quotas.css'
import { Button, Field, SelectTabData, SelectTabEvent, Tab, TabList } from "@fluentui/react-components"
import { Nation } from "./api/types"
import { Subtract16Filled, Add16Filled } from '@fluentui/react-icons'
import { monitor } from "./api/ws-api"

interface AmountBarProps {
    amount: number
    max: number
}

const AmountBar = ({ amount, max }: AmountBarProps) => {
    return (
        <div style={{ width: "10em", display: 'block', height: '10px', backgroundColor: 'black' }}>
            <div style={{ width: "" + (100 * amount / max) + "%", backgroundColor: "green", display: 'block', height: '10px' }} />
        </div>
    )
}

interface QuotasProps {
    nation: Nation

    onClose: (() => void)
}

const Quotas = ({ nation, onClose }: QuotasProps) => {
    const [materialToManage, setMaterialToManage] = useState<'COAL' | 'WHEAT' | 'WATER' | 'PLANK' | 'FOOD'>('COAL')
    const [mintAmount, setMintAmount] = useState<number>(5)
    const [armoryAmount, setArmoryAmount] = useState<number>(5)
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

    useEffect(() => {
        (async () => {
            const coalQuotas = await monitor.getCoalQuotas()

            setMintAmount(coalQuotas.mint)
            setArmoryAmount(coalQuotas.armory)
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
        monitor.setWaterQuotas(bakeryAmount, donkeyFarmWaterAmount, pigFarmWaterAmount, breweryWaterAmount)

        return () => {}
    }, [bakeryAmount, donkeyFarmWaterAmount, pigFarmWaterAmount, breweryWaterAmount])

    useEffect(() => {
        monitor.setCoalQuotas(mintAmount, armoryAmount, ironSmelterAmount)

        return () => { }
    }, [mintAmount, armoryAmount, ironSmelterAmount])

    useEffect(() => {
        monitor.setFoodQuotas(ironMineAmount, coalMineAmount, goldMineAmount, graniteMineAmount)

        return () => { }
    }, [ironMineAmount, coalMineAmount, goldMineAmount, graniteMineAmount])

    useEffect(() => {
        console.log("Should set water consumption: ", { bakeryAmount, donkeyFarmWaterAmount, pigFarmWaterAmount })

        return () => { }
    }, [bakeryAmount, donkeyFarmWaterAmount, pigFarmWaterAmount])

    useEffect(() => {
        console.log("Should set wheat consumption: ", { millAmount, donkeyFarmWheatAmount, pigFarmWheatAmount })

    }, [millAmount, donkeyFarmWheatAmount, pigFarmWheatAmount])

    useEffect(() => {
        monitor.setWheatQuotas(donkeyFarmWheatAmount, pigFarmWheatAmount, millAmount, breweryWheatAmount)
    }, [donkeyFarmWheatAmount, pigFarmWheatAmount, millAmount, breweryWheatAmount])

    return (
        <div className="quotas-window">

            <h1>Quotas</h1>

            <TabList
                defaultSelectedValue={materialToManage}
                onTabSelect={
                    (event: SelectTabEvent, data: SelectTabData) => {
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
                        }
                    }
                }
            >
                <Tab value={'COAL'}>Coal</Tab>
                <Tab value={'WHEAT'}>Wheat</Tab>
                <Tab value={'WATER'}>Water</Tab>
                <Tab value={'PLANK'}>Plank</Tab>
                <Tab value={'FOOD'}>Food</Tab>
            </TabList>

            {materialToManage === 'COAL' &&
                <>
                    <Field label="Mint">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Mint" nation={nation} />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setMintAmount((previous) => previous - 1)} />
                                <AmountBar amount={mintAmount} max={10} />
                                <Add16Filled onClick={() => setMintAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Armory">
                        <div className="quota-for-house">
                            <HouseIcon houseType="Armory" nation={nation} />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setArmoryAmount((previous) => previous - 1)} />
                                <AmountBar amount={armoryAmount} max={10} />
                                <Add16Filled onClick={() => setArmoryAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Iron smelter">
                        <div className="quota-for-house">
                            <HouseIcon houseType="IronSmelter" nation={nation} />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setIronSmelterAmount((previous) => previous - 1)} />
                                <AmountBar amount={ironSmelterAmount} max={10} />
                                <Add16Filled onClick={() => setIronSmelterAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'FOOD' &&
                <>

                    <Field label="Iron mine">
                        <div className="quota-for-house">
                            <HouseIcon houseType="IronMine" nation={nation} />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setIronMineAmount((previous) => previous - 1)} />
                                <AmountBar amount={ironMineAmount} max={10} />
                                <Add16Filled onClick={() => setIronMineAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Coal mine">
                        <div className="quota-for-house">
                            <HouseIcon houseType="CoalMine" nation={nation} />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setCoalMineAmount((previous) => previous - 1)} />
                                <AmountBar amount={coalMineAmount} max={10} />
                                <Add16Filled onClick={() => setCoalMineAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Gold mine">
                        <div className="quota-for-house">
                            <HouseIcon houseType="GoldMine" nation={nation} />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setGoldMineAmount((previous) => previous - 1)} />
                                <AmountBar amount={goldMineAmount} max={10} />
                                <Add16Filled onClick={() => setGoldMineAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>

                    <Field label="Granite mine">
                        <div className="quota-for-house">
                            <HouseIcon houseType="GraniteMine" nation={nation} />

                            <div className="quota">
                                <Subtract16Filled onClick={() => setGraniteMineAmount((previous) => previous - 1)} />
                                <AmountBar amount={graniteMineAmount} max={10} />
                                <Add16Filled onClick={() => setGraniteMineAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'WATER' &&
                <>
                    <Field label="Bakery">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Bakery" nation={nation} />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setBakeryAmount((previous) => previous - 1)} />
                                <AmountBar amount={bakeryAmount} max={10} />
                                <Add16Filled onClick={() => setBakeryAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Donkey farm">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="DonkeyFarm" nation={nation} />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setDonkeyFarmWaterAmount((previous) => previous - 1)} />
                                <AmountBar amount={donkeyFarmWaterAmount} max={10} />
                                <Add16Filled onClick={() => setDonkeyFarmWaterAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Pig farm">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Mint" nation={nation} />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setPigFarmWaterAmount((previous) => previous - 1)} />
                                <AmountBar amount={pigFarmWaterAmount} max={10} />
                                <Add16Filled onClick={() => setPigFarmWaterAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Brewery">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Brewery" nation={nation} />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setBreweryWaterAmount((previous) => previous - 1)} />
                                <AmountBar amount={breweryWaterAmount} max={10} />
                                <Add16Filled onClick={() => setBreweryWaterAmount((previous) => previous + 1)} />
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
                                <Subtract16Filled onClick={() => setConstructionAmount((previous) => previous - 1)} />
                                <AmountBar amount={constructionAmount} max={10} />
                                <Add16Filled onClick={() => setConstructionAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Boats and ships">
                        <div className="quota-for-house" >
                            <div>Boats and ships</div>
                            <div className="quota">
                                <Subtract16Filled onClick={() => setBoatsAndShipsAmount((previous) => previous - 1)} />
                                <AmountBar amount={boatsAndShipsAmount} max={10} />
                                <Add16Filled onClick={() => setBoatsAndShipsAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                </>
            }

            {materialToManage === 'WHEAT' &&
                <>
                    <Field label="Mill">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Mill" nation={nation} />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setMillAmount((previous) => previous - 1)} />
                                <AmountBar amount={millAmount} max={10} />
                                <Add16Filled onClick={() => setMillAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Donkey farm">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="DonkeyFarm" nation={nation} />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setDonkeyFarmWheatAmount((previous) => previous - 1)} />
                                <AmountBar amount={donkeyFarmWheatAmount} max={10} />
                                <Add16Filled onClick={() => setDonkeyFarmWheatAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Pig farm">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Mint" nation={nation} />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setPigFarmWheatAmount((previous) => previous - 1)} />
                                <AmountBar amount={pigFarmWheatAmount} max={10} />
                                <Add16Filled onClick={() => setPigFarmWheatAmount((previous) => previous + 1)} />
                            </div>
                        </div>
                    </Field>
                    <Field label="Brewery">
                        <div className="quota-for-house" >
                            <HouseIcon houseType="Brewery" nation={nation} />
                            <div className="quota">
                                <Subtract16Filled onClick={() => setBreweryWheatAmount((previous) => previous - 1)} />
                                <AmountBar amount={breweryWheatAmount} max={10} />
                                <Add16Filled onClick={() => setBreweryWheatAmount((previous) => previous + 1)} />
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