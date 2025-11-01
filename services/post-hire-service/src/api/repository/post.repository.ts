import { CreatePostDTO } from "@/api/model/post.model";
import { Collection, InsertOneResult } from "mongodb";

export interface IPostRepository {
    createPost(post: CreatePostDTO): any
}

export class PostRepository implements IPostRepository {
    private postCollection: Collection;

    constructor(postCollection: Collection) {
        this.postCollection = postCollection
    }

    public async createPost(post: CreatePostDTO): Promise<InsertOneResult> {
        const result = await this.postCollection.insertOne(post);
        return result;
    }
}