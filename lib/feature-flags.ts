export type FeatureFlag =
    | "AI_GENERATION"       // IA, Reconocimiento de planos, 3D
    | "ADVANCED_EDITOR"     // Herramientas complejas del editor (Clonación, Arc, etc)
    | "BETA_TESTING"        // Funcionalidades inestables

// Lista de correos con acceso total (MASTER USERS)
export const MASTER_EMAILS = [
    "presupuestaloficial@gmail.com",
    "admin@presupuestalo.com",
];

export const checkFeature = (feature: FeatureFlag, userEmail?: string | null): boolean => {
    // 1. Master users siempre tienen acceso a todo
    if (userEmail && MASTER_EMAILS.includes(userEmail)) {
        return true;
    }

    // 2. Reglas por defecto para usuarios normales
    switch (feature) {
        case "AI_GENERATION":
            return false; // FASE 3: Apagado por defecto

        case "ADVANCED_EDITOR":
            return true; // FASE 2: Encendido (acabamos de lanzarlo)

        case "BETA_TESTING":
            return false;

        default:
            return true;
    }
}
