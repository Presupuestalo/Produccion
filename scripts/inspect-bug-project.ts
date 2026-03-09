
import { createClient } from "@supabase/supabase-js"
import * as dotenv from "dotenv"
import path from "path"
import fs from "fs"

// Load env vars from .env.local
const envPath = path.resolve(process.cwd(), ".env.local")
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath))
    for (const k in envConfig) {
        process.env[k] = envConfig[k]
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function inspectProject() {
    const projectId = "a7e9d9ea-b35d-407a-aed4-14a91203525b"
    console.log(`Inspecting project: ${projectId}`)

    const { data: project, error: pError } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single()

    if (pError) {
        console.error("Error fetching project:", pError)
        return
    }

    console.log("\n--- Project Info ---")
    console.log(`Name: ${project.name}`)
    console.log(`Structure Type: ${project.structure_type}`)

    const { data: calcDataEntry, error: cError } = await supabase
        .from("calculator_data")
        .select("*")
        .eq("project_id", projectId)
        .single()

    if (cError) {
        console.error("Error fetching calculator_data:", cError)
        return
    }

    const calcDataRaw = calcDataEntry.data

    console.log("Raw calculator_data (first 1000 chars):")
    console.log(JSON.stringify(calcDataRaw, null, 2).substring(0, 1000))

    // Sometimes it's nested under another 'data' key, sometimes not
    let calcData = calcDataRaw
    if (calcDataRaw && calcDataRaw.data) {
        console.log("Found nested 'data' key, drilling down...")
        calcData = calcDataRaw.data
    }

    const reformRooms = calcData.reform_rooms || calcData.reformRooms || []
    console.log(`Found ${reformRooms.length} reform rooms.`)
    console.log("Keys in calcData:", Object.keys(calcData))

    console.log("\n--- Reform Rooms from calculator_data table ---")
    reformRooms.forEach(room => {
        console.log(`- Room: ${room.name} (Type: ${room.type})`)
        console.log(`  Area: ${room.area} m²`)
        console.log(`  Floor Material: ${room.floorMaterial}`)
        console.log(`  Full Room Object:`, JSON.stringify(room, null, 2))
    })

    console.log("\n--- Logic Simulation (as in BudgetGenerator.tsx) ---")

    let interiorTotalArea = 0;
    let interiorCeramicArea = 0;

    reformRooms.forEach(room => {
        const roomName = (room.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const roomType = (room.type || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const customType = (room.customRoomType || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        const isExterior = roomName.includes("terraza") || roomType.includes("terraza") || customType.includes("terraza") ||
            roomName.includes("balco") || roomType.includes("balco") || customType.includes("balco");

        const isTech = roomName.includes("otras ventanas") || roomType.includes("otras ventanas") || customType.includes("otras ventanas");

        if (isTech) return;

        const area = room.area || (room.width * room.length) || 0;

        if (!isExterior) {
            interiorTotalArea += area;
        }

        const normFloor = (room.floorMaterial || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const isCeramicMat = normFloor === "ceramico" || normFloor === "ceramica";
        const isOtherMat = ["madera", "suelo laminado", "suelo vinilico", "parquet flotante"].includes(normFloor);
        const isNoMod = normFloor === "no se modifica";

        const isBathroomOrKitchenResult = roomType.includes("bano") || roomType.includes("cocina") || roomType.includes("aseo") ||
            roomName.includes("bano") || roomName.includes("cocina") || roomName.includes("aseo");

        let willHaveArlita = false;
        if (isCeramicMat) {
            willHaveArlita = true;
        } else if (isBathroomOrKitchenResult && !isNoMod) {
            willHaveArlita = true;
        } else if (!isOtherMat && !isNoMod) {
            // Assume tileAllFloors is false as per default
            // if (tileAllFloors) willHaveArlita = true;
        }

        if (willHaveArlita && !isExterior) {
            interiorCeramicArea += area;
        }

        console.log(`Room: ${room.name}`);
        console.log(`  Normalized Name: "${roomName}"`);
        console.log(`  Normalized Type: "${roomType}"`);
        console.log(`  Normalized Floor: "${normFloor}"`);
        console.log(`  isBathroomOrKitchen: ${isBathroomOrKitchenResult}`);
        console.log(`  willHaveArlita: ${willHaveArlita}`);
        console.log(`  Area added: ${willHaveArlita ? area : 0} m²`);
    });

    console.log("\n--- Final Results ---")
    console.log(`Interior Total: ${interiorTotalArea.toFixed(2)} m²`);
    console.log(`Arlita Area (interiorCeramicArea): ${interiorCeramicArea.toFixed(2)} m²`);
    console.log(`Rastrelado Area: ${(interiorTotalArea - interiorCeramicArea).toFixed(2)} m²`);
}

inspectProject()
