import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import { CreateCommentDTO, UpdateCommentDTO } from "../model/comment.model";
import { Document, InsertOneResult, ObjectId, UpdateResult, WithId } from "mongodb";

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
}