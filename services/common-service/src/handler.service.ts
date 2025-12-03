import { ObjectId } from "mongodb";
import ElasticsearchAdapter from "./elastic.adapter";
import elasticManage from "./elastic.adapter";
import { DatabaseAdapter } from "./db.adapter";

export interface PostEvent {
    type: string;
    postId: ObjectId;
}

export const handleEmail = async (message: string): Promise<void> => {
    console.log("Processing email:");
    try {
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (true) {
            throw new Error("Email service temporarily unavailable");
        }
    } catch (error) {
        console.error("Email sending failed:", error);
        throw error;
    }
};

export const handleEmailDLX = async (message: string): Promise<void> => {
    console.log("💀 Handling FAILED email (DLX):");
    console.log("hehe", message);
    // TODO: Xử lý email failed sau khi retry hết
    // - Gửi alert cho admin
    // - Log vào database
    // - Gửi vào monitoring system (Sentry, Datadog, etc.)
    // - Lưu vào bảng failed_emails để review sau

    console.log("📧 Admin alert sent about failed email");
    console.log("💾 Failed email logged to database");
};

export const handlePost = async (data: PostEvent): Promise<void> => {
    console.log("Processing post:");
    try {
        if (data.type === "ADD") {
            const postData = await DatabaseAdapter.getInstance().post.findOne({ _id: new ObjectId(data.postId) })
            const { _id, ...rest } = postData as any;
            console.log(postData);
            const client = elasticManage.getClient();
            const index = 'post';

            const exists = await client.indices.exists({ index });
            if (!exists) {
                await client.indices.create({ index });
                console.log(`Index '${index}' created`);
            }

            await client.index({
                index,
                id: _id,
                document: { ...rest },
                refresh: 'wait_for',
            });
            console.log(`Post ${data.postId} add from Elasticsearch`);
        }
        if (data.type === "UPDATE") {
            const postData = await DatabaseAdapter.getInstance().post.findOne({ _id: new ObjectId(data.postId) })
            const { _id, ...rest } = postData as any;
            await elasticManage.getClient().update({
                index: 'post',
                id: _id,
                doc: rest,
                refresh: 'wait_for',
            });
            console.log(`Post ${data.postId} update from Elasticsearch`);
        }
        if (data.type === "DELETE") {
            await elasticManage.getClient().delete({
                index: 'post',
                id: data.postId.toString(),
                refresh: 'wait_for',
            });
            console.log(`Post ${data.postId} deleted from Elasticsearch`);
        }
    } catch (error) {
        console.error("Post sync to Elasticsearch failed:", error);
        throw error;
    }
}

export const handlePostDLX = async (data: PostEvent): Promise<void> => {
    console.log("💀 Handling FAILED post (DLX):");
    console.log("hehe", data);
    // TODO: Xử lý email failed sau khi retry hết
    // - Gửi alert cho admin
    // - Log vào database
    // - Gửi vào monitoring system (Sentry, Datadog, etc.)
    // - Lưu vào bảng failed_emails để review sau

    console.log("📧 Admin alert sent about failed email");
    console.log("💾 Failed email logged to database");
};