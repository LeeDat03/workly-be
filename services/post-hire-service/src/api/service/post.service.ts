import { IPostRepository } from "@/api/repository/post.repository";
import { CreatePostDTO } from "@/api/model/post.model";
import { InsertOneResult } from "mongodb";

export interface IPostService {
    createPost(post: CreatePostDTO): Promise<InsertOneResult>
}

export class PostService implements IPostService {
    private postRepository: IPostRepository;

    constructor(postRepository: IPostRepository) {
        this.postRepository = postRepository;
    }

    public createPost = async (post: CreatePostDTO): Promise<InsertOneResult> => {
        return await this.postRepository.createPost(post)
    }
}