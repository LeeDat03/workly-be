import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { Collection } from "mongodb";

export const initializeIndexModel = async () => {
    const dbAdapter = DatabaseAdapter.getInstance();
    await initializeIndexModelPost(dbAdapter.post)

}

const initializeIndexModelPost = async (postCollection: Collection) => {
    await postCollection.createIndex({ author_id: 1, id: 1 }, { unique: true });
}