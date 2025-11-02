import { ICommentRepository } from "@/api/repository/comment.repository";
import { CreateCommentDTO, UpdateCommentDTO } from "@/api/model/comment.model";
import { InsertOneResult, ObjectId, UpdateResult } from "mongodb";
import { IPostRepository } from "../repository/post.repository";
import { APIError } from "@/common/error/api.error";
import { StatusCode } from "@/common/errors";
import path from "path";
import { FileUtil } from "@/util/fileUtil";

export interface ICommentService {
    createComment(data: CreateCommentDTO): Promise<InsertOneResult>
    updateComment(data: UpdateCommentDTO, id: ObjectId): Promise<UpdateResult>
}

export class CommentService implements ICommentService {
    private commentRepository: ICommentRepository;
    private postRepository: IPostRepository;
    constructor(
        commentRepository: ICommentRepository,
        postRepository: IPostRepository
    ) {
        this.commentRepository = commentRepository;
        this.postRepository = postRepository
    }

    public createComment = async (data: CreateCommentDTO): Promise<InsertOneResult> => {

        const isPostExisted = await this.postRepository.getPostDetail(new ObjectId(data.postId));
        if (!isPostExisted) {
            throw new APIError(
                {
                    message: 'post.notfound',
                    status: StatusCode.BAD_REQUEST,
                }
            )
        }

        if (data.parentId) {
            const isCommentExisted = await this.commentRepository.getCommentDetail(new ObjectId(data.parentId));
            if (!isCommentExisted) {
                throw new APIError(
                    {
                        message: 'comment.notfound',
                        status: StatusCode.BAD_REQUEST,
                    }
                )
            }
        }

        const result = await this.commentRepository.createComment(data);
        return result
    }

    public updateComment = async (data: UpdateCommentDTO, id: ObjectId): Promise<UpdateResult> => {
        const isCommentExisted = await this.commentRepository.getCommentDetail(id);
        if (!isCommentExisted) {
            throw new APIError(
                {
                    message: 'comment.notfound',
                    status: StatusCode.BAD_REQUEST,
                }
            )
        }
        const result = await this.commentRepository.updateComment(data, id)

        if (data.mediaFile) {
            if (data.mediaFile.delete) {
                const TARGET_DIR = path.resolve(__dirname, "../../../uploads/posts/images")
                const fullPath = path.join(TARGET_DIR, data.mediaFile.delete);
                FileUtil.deleteFilePath(fullPath);
            }
        }
        return result;
    }
}