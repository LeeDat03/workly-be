import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { CommentResponse, CreateCommentDTO, UpdateCommentDTO } from "../model/comment.model";
import { Document, InsertOneResult, ObjectId, UpdateResult, WithId } from "mongodb";

export interface ICommentRepository {
    createComment(data: CreateCommentDTO): Promise<InsertOneResult>
    getCommentById(id: ObjectId): Promise<CommentResponse | null>
    updateComment(data: UpdateCommentDTO, id: ObjectId): Promise<UpdateResult>
    getAllComment(postId: string): Promise<CommentResponse[]>
}

export class CommentRepository implements ICommentRepository {

    private commentCollection: DatabaseAdapter;

    constructor(
        commentCollection: DatabaseAdapter
    ) {
        this.commentCollection = commentCollection
    }

    private convertComment = async (
        item: WithId<Document>,
        commentCollection: any
    ): Promise<CommentResponse> => {

        const replyCount = await commentCollection.countDocuments({
            parentId: item._id,
        });

        return {
            id: item._id.toString(),
            authorId: item.content,
            content: item.content,
            mediaFile: item.mediaFile,
            replyCount: replyCount,
            parentId: item.parentId
        };
    };
    public createComment = async (data: CreateCommentDTO): Promise<InsertOneResult> => {
        return await this.commentCollection.comment.insertOne({ ...data, createdAt: new Date() })
    }

    public getCommentById = async (id: ObjectId): Promise<CommentResponse | null> => {
        const doc = await this.commentCollection.comment.findOne({ _id: id })

        if (!doc) return null;


        return await this.convertComment(doc, this.commentCollection.comment);
    }

    public updateComment = async (data: UpdateCommentDTO, id: ObjectId): Promise<UpdateResult> => {
        const updateFields: any = {};
        if (data.content) updateFields.content = data.content;
        if (data.mediaFile) {
            if (data.mediaFile.add) {
                updateFields.mediaFile = data.mediaFile.add;
            }
        }
        return await this.commentCollection.comment.updateOne(
            { _id: id },
            {
                $set: updateFields
            }
        )
    }
    public getAllComment = async (postId: string): Promise<CommentResponse[]> => {
        let query: any = { postId: postId };
        console.log(query);

        const result = await this.commentCollection.comment.find(query).sort({ createdAt: -1 }).toArray();

        const data = await Promise.all(
            result.map(item => this.convertComment(item, this.commentCollection.comment)
            )
        );
        return data;
    }


    // public getPagingRootComment = async (input: IPaginationInput, postId: ObjectId): Promise<PagingList<CommentResponse>> => {
    //     const page = input.page ?? 1;
    //     const size = input.size ?? 10;
    //     const skip = (page - 1) * size;
    //     let query: any = { postId: postId };

    //     const [result, total] = await Promise.all([
    //         this.commentCollection.comment.find(query).skip(skip).limit(size).toArray(),
    //         this.commentCollection.comment.countDocuments(),
    //     ]);
    //     const data = await Promise.all(
    //         result.map(async (item) => {
    //             const countSubComment = await this.commentCollection.comment.countDocuments({ parentId: item._id });
    //             return {
    //                 authorId: item.content,
    //                 content: item.content,
    //                 mediaFile: item.mediaFile,
    //                 replyCount: countSubComment,
    //             };
    //         })
    //     );
    //     return {
    //         data,
    //         pagination: {
    //             page,
    //             size,
    //             total,
    //             totalPages: Math.ceil(total / size),
    //         },
    //     };
    // }
    // public getPagingComment = async (input: IPaginationInput, parentId: ObjectId): Promise<PagingList<CommentResponse>> => {
    //     const page = input.page ?? 1;
    //     const size = input.size ?? 10;
    //     const skip = (page - 1) * size;
    //     let query: any = { parentId: parentId };

    //     const [result, total] = await Promise.all([
    //         this.commentCollection.comment.find(query).skip(skip).limit(size).toArray(),
    //         this.commentCollection.comment.countDocuments(),
    //     ]);

    //     const data = await Promise.all(
    //         result.map(async (item) => {
    //             const countSubComment = await this.commentCollection.comment.countDocuments({ parentId: item._id });
    //             return {
    //                 authorId: item.content,
    //                 content: item.content,
    //                 mediaFile: item.mediaFile,
    //                 replyCount: countSubComment,
    //             };
    //         })
    //     )

    //     return {
    //         data,
    //         pagination: {
    //             page,
    //             size,
    //             total,
    //             totalPages: Math.ceil(total / size),
    //         },
    //     };
    // }
}
