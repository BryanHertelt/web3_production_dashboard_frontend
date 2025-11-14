import { Asset } from "@/entities/asset"

export type DataTableProps = {
    data: Asset[],
    config?:{
        name: string
    }
}