import { useFeatureFlags } from "@/hooks/use-feature-flags"

const test = () => {
    const { isFeatureEnabled } = useFeatureFlags()
    console.log(isFeatureEnabled("ADVANCED_EDITOR"))
}
