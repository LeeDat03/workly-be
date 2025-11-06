import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { CommentResponse, CreateCommentDTO, UpdateCommentDTO } from "../model/comment.model";
import { Document, InsertOneResult, ObjectId, UpdateResult, WithId } from "mongodb";
import { IPaginationInput, PagingList } from "../model/common.model";

export interface ICommentRepository {
    createComment(data: CreateCommentDTO): Promise<InsertOneResult>
    getCommentDetail(id: ObjectId): Promise<WithId<Document> | null>
    updateComment(data: UpdateCommentDTO, id: ObjectId): Promise<UpdateResult>
}

export class CommentRepository implements ICommentRepository {

    private commentCollection: DatabaseAdapter;

    constructor(
        commentCollection: DatabaseAdapter
    ) {
        this.commentCollection = commentCollection
    }

    public createComment = async (data: CreateCommentDTO): Promise<InsertOneResult> => {
        return await this.commentCollection.comment.insertOne(data)
    }

    public getCommentDetail = async (id: ObjectId): Promise<WithId<Document> | null> => {
        return await this.commentCollection.comment.findOne({ _id: id })
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

    public getPagingRootComment = async (input: IPaginationInput, postId: ObjectId): Promise<PagingList<CommentResponse>> => {
        const page = input.page ?? 1;
        const size = input.size ?? 10;
        const skip = (page - 1) * size;
        let query: any = { postId: postId };

        const [result, total] = await Promise.all([
            this.commentCollection.comment.find(query).skip(skip).limit(size).toArray(),
            this.commentCollection.comment.countDocuments(),
        ]);
        const data = await Promise.all(
            result.map(async (item) => {
                const countSubComment = await this.commentCollection.comment.countDocuments({ parentId: item._id });
                return {
                    authorId: item.content,
                    content: item.content,
                    mediaFile: item.mediaFile,
                    replyCount: countSubComment,
                };
            })
        );
        return {
            data,
            pagination: {
                page,
                size,
                total,
                totalPages: Math.ceil(total / size),
            },
        };
    }
    public getPagingComment = async (input: IPaginationInput, parentId: ObjectId): Promise<PagingList<CommentResponse>> => {
        const page = input.page ?? 1;
        const size = input.size ?? 10;
        const skip = (page - 1) * size;
        let query: any = { parentId: parentId };

        const [result, total] = await Promise.all([
            this.commentCollection.comment.find(query).skip(skip).limit(size).toArray(),
            this.commentCollection.comment.countDocuments(),
        ]);

        const data = await Promise.all(
            result.map(async (item) => {
                const countSubComment = await this.commentCollection.comment.countDocuments({ parentId: item._id });
                return {
                    authorId: item.content,
                    content: item.content,
                    mediaFile: item.mediaFile,
                    replyCount: countSubComment,
                };
            })
        )

        return {
            data,
            pagination: {
                page,
                size,
                total,
                totalPages: Math.ceil(total / size),
            },
        };
    }
}