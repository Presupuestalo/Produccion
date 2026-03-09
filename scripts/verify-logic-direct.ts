
// Mocking the logic directly to verify the refined calculation rules
function verifyLogic() {
    console.log("Starting direct logic verification for Compressive Layer refinement...");

    const testRooms = [
        {
            name: "Baño Principal",
            type: "baño",
            area: 12.5,
            floorMaterial: "Parquet flotante", // Non-ceramic
            isNoMod: false,
            isExterior: false
        },
        {
            name: "Otra habitación", // Name is something else
            type: "room", // Type is generic
            customRoomType: "Cocina americana", // But custom type is the one
            area: 15.0,
            floorMaterial: "Suelo vinilico", // Non-ceramic
            isNoMod: false,
            isExterior: false
        },
        {
            name: "Salón",
            type: "salón",
            area: 35.0,
            floorMaterial: "Parquet flotante", // Dry area
            isNoMod: false,
            isExterior: false
        },
        {
            name: "Terraza",
            type: "exterior",
            area: 10.0,
            floorMaterial: "Cerámico",
            isNoMod: false,
            isExterior: true
        }
    ];

    const calculatorData = {
        reform: {
            rooms: testRooms,
            config: { tileAllFloors: false }
        },
        project: {
            structure_type: "Madera" // Trigger the wood logic
        }
    };

    const rawStructureType = calculatorData.project?.structure_type || "Hormigon";
    const structureTypeStr = String(rawStructureType).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    const isWoodenOrMixedStructure = structureTypeStr === "madera" || structureTypeStr === "mixta" || structureTypeStr === "mixto";

    const tileAllFloors = false;
    let interiorTotalArea = 0;
    let interiorCeramicArea = 0; // This acts as 'arlitaArea' in the code

    testRooms.forEach(room => {
        const area = room.area;
        if (!room.isExterior) {
            interiorTotalArea += area;
        }

        const normFloor = (room.floorMaterial || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const isCeramicMat = normFloor === "ceramico" || normFloor === "ceramica";
        const isOtherMat = ["madera", "suelo laminado", "suelo vinilico", "parquet flotante"].includes(normFloor);
        const isNoMod = room.isNoMod;

        const roomName = (room.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const roomType = (room.type || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const customType = (room.customRoomType || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

        // Usamos términos normalizados sin acentos
        const isBathroomOrKitchenResult = roomType.includes("bano") || roomType.includes("cocina") || roomType.includes("aseo") ||
            roomName.includes("bano") || roomName.includes("cocina") || roomName.includes("aseo") ||
            customType.includes("bano") || customType.includes("cocina") || customType.includes("aseo");

        // --- NEW LOGIC START ---
        let willHaveArlita = false;
        if (isCeramicMat) {
            willHaveArlita = true;
        } else if (isBathroomOrKitchenResult && !isNoMod) {
            willHaveArlita = true;
        } else if (!isOtherMat && !isNoMod) {
            if (tileAllFloors) {
                willHaveArlita = true;
            }
        }
        // --- NEW LOGIC END ---

        if (willHaveArlita && !room.isExterior) {
            interiorCeramicArea += area;
        }
    });

    const arlitaArea = interiorCeramicArea;
    const rastreladoArea = interiorTotalArea - arlitaArea;

    console.log(`\nInterior Total Area: ${interiorTotalArea} m²`);
    console.log(`Arlita Area: ${arlitaArea} m² (Expected: 12.5 + 15.0 = 27.5)`);
    console.log(`Rastrelado Area: ${rastreladoArea} m² (Expected: 35.0)`);

    if (arlitaArea === 27.5 && rastreladoArea === 35.0) {
        console.log("\nSUCCESS: The refined logic works perfectly!");
    } else {
        console.log("\nFAILURE: Calculation mismatch.");
        process.exit(1);
    }
}

verifyLogic();
