import { DatabaseAdapter } from "@/common/infrastructure/database.adapter";
import elasticManage from "@/common/infrastructure/elasticsearch.adapter";
import { ObjectId } from "mongodb";


export interface BaseEvent {
    type: string;
    id: String | ObjectId;
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
    console.log("📧 Admin alert sent about failed email");
    console.log("💾 Failed email logged to database");
};

export const handlePost = async (data: BaseEvent): Promise<void> => {
    console.log("Processing post:");
    const client = elasticManage.getClient();
    const index = 'post';
    const exists = await client.indices.exists({ index });
    if (!exists) {
        await client.indices.create({
            index: index
        });
    }
    try {
        if (data.type === "ADD") {
            const postData = await DatabaseAdapter.getInstance().post.findOne({ _id: new ObjectId(data.id.toString()) })
            const { _id, ...rest } = postData as any;
            await client.create({
                index,
                id: _id,
                document: { content: rest.content },
                refresh: 'wait_for',
            });
            console.log(`Post ${data.id} add from Elasticsearch`);
        }
        if (data.type === "UPDATE") {
            const postData = await DatabaseAdapter.getInstance().post.findOne({ _id: new ObjectId(data.id.toString()) })
            const { _id, content } = postData as any;
            await client.update({
                index,
                id: _id,
                doc: { content: content },
                refresh: 'wait_for',
            });
            console.log(`Post ${data.id} update from Elasticsearch`);
        }
        if (data.type === "DELETE") {
            await client.delete({
                index,
                id: data.id.toString(),
                refresh: 'wait_for',
            });
            console.log(`Post ${data.id} deleted from Elasticsearch`);
        }
    } catch (error) {
        console.error("Post sync to Elasticsearch failed:", error);
        throw error;
    }
}

export const handleJob = async (data: BaseEvent): Promise<void> => {
    console.log("Processing job:");
    try {
        console.log("data", data);
        const client = elasticManage.getClient();
        const index = 'job';

        const exists = await client.indices.exists({ index });
        if (!exists) {
            await client.indices.create({
                index: "job",
            });
        }
        if (data.type === "ADD") {
            const jobData = await DatabaseAdapter.getInstance().job.findOne({ _id: new ObjectId(data.id.toString()) })
            const { _id, title, content, endDate, skills, level } = jobData as any;
            await client.create({
                index,
                id: _id,
                document: { title: title, content: content, endDate: endDate, skills: skills, level },
                refresh: 'wait_for',
            });
            console.log(`job ${data.id} add from Elasticsearch`);
        }
        if (data.type === "UPDATE") {
            const jobData = await DatabaseAdapter.getInstance().job.findOne({ _id: new ObjectId(data.id.toString()) })
            const { _id, title, content, endDate, skill } = jobData as any;
            await client.update({
                index,
                id: _id,
                doc: { title: title, content: content, endDate: endDate, skill: skill },
                refresh: 'wait_for',
            });
            console.log(`job ${data.id} update from Elasticsearch`);
        }
        if (data.type === "DELETE") {
            await client.delete({
                index: 'job',
                id: data.id.toString(),
                refresh: 'wait_for',
            });
            console.log(`job ${data.id} deleted from Elasticsearch`);
        }
    } catch (error) {
        console.error("job sync to Elasticsearch failed:", error);
        throw error;
    }
}

export const handleUser = async (data: any): Promise<void> => {
    try {
        console.log("Processing user:");
        const client = elasticManage.getClient();
        const index = 'user';

        const exists = await client.indices.exists({ index });
        if (!exists) {
            await client.indices.create({
                index: index,
            });
        }
        if (data.type === "ADD") {
            const { id, name } = data;
            await client.create({
                index,
                id: id,
                document: { name: name },
                refresh: 'wait_for',
            });
            console.log(`user ${data.id} add from Elasticsearch`);
        }
        if (data.type === "UPDATE") {
            const { id, name } = data;
            await client.update({
                index,
                id: id,
                doc: { name: name },
                refresh: 'wait_for',
            });
            console.log(`user ${data.id} update from Elasticsearch`);
        }
        if (data.type === "DELETE") {
            await Promise.allSettled([
                DatabaseAdapter.getInstance().post.deleteMany({
                    author_id: data.id,
                    author_type: "USER"
                }),
                DatabaseAdapter.getInstance().comment.deleteMany({
                    authorId: data.id
                }),
                DatabaseAdapter.getInstance().candidate.deleteMany({
                    userId: data.id
                }),
                DatabaseAdapter.getInstance().like.deleteMany({
                    authorId: data.id
                }),
                client.delete({
                    index,
                    id: data.id,
                    refresh: 'wait_for',
                }),

            ]);
            console.log(`job ${data.id} deleted from Elasticsearch`);
        }
    } catch (error) {
        console.error("job sync to Elasticsearch failed:", error);
        throw error;
    }
}

export const handleCompany = async (data: any): Promise<void> => {
    try {
        console.log("Processing company:");
        const client = elasticManage.getClient();
        const index = 'company';

        const exists = await client.indices.exists({ index });
        if (!exists) {
            await client.indices.create({
                index: index
            });
        }
        if (data.type === "ADD") {
            const { id, name } = data;
            await client.create({
                index,
                id: id,
                document: { name: name },
                refresh: 'wait_for',
            });
            console.log(`user ${data.id} add from Elasticsearch`);
        }
        if (data.type === "UPDATE") {
            const { id, name } = data;
            await client.update({
                index,
                id: id,
                doc: { name: name },
                refresh: 'wait_for',
            });
            console.log(`user ${data.id} update from Elasticsearch`);
        }
        if (data.type === "DELETE") {
            await Promise.allSettled([
                await DatabaseAdapter.getInstance().post.deleteMany({ author_id: data.id, author_type: "COMPANY" }),
                await DatabaseAdapter.getInstance().job.deleteMany({ companyId: data.id }),
                await client.delete({
                    index,
                    id: data.id,
                    refresh: 'wait_for',
                })
            ]);

            console.log(`job ${data.id} deleted from Elasticsearch`);
        }
    } catch (error) {
        console.error("job sync to Elasticsearch failed:", error);
        throw error;
    }
}


export const handleJobDLX = async (data: BaseEvent): Promise<void> => {
    console.log("💀 Handling FAILED job (DLX):");
    console.log("hehe", data);
    // TODO: Xử lý email failed sau khi retry hết
    // - Gửi alert cho admin
    // - Log vào database
    // - Gửi vào monitoring system (Sentry, Datadog, etc.)
    // - Lưu vào bảng failed_emails để review sau

    console.log("📧 Admin alert sent about failed email");
    console.log("💾 Failed email logged to database");
};

export const handlePostDLX = async (data: BaseEvent): Promise<void> => {
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

export const handleUserDLX = async (data: BaseEvent): Promise<void> => {
    console.log("💀 Handling FAILED USER (DLX):");
    console.log("hehe", data);
    // TODO: Xử lý email failed sau khi retry hết
    // - Gửi alert cho admin
    // - Log vào database
    // - Gửi vào monitoring system (Sentry, Datadog, etc.)
    // - Lưu vào bảng failed_emails để review sau

    console.log("📧 Admin alert sent about failed email");
    console.log("💾 Failed email logged to database");
};

export const handleCompanyDLX = async (data: BaseEvent): Promise<void> => {
    console.log("💀 Handling FAILED COMPANY (DLX):");
    console.log("hehe", data);
    // TODO: Xử lý email failed sau khi retry hết
    // - Gửi alert cho admin
    // - Log vào database
    // - Gửi vào monitoring system (Sentry, Datadog, etc.)
    // - Lưu vào bảng failed_emails để review sau

    console.log("📧 Admin alert sent about failed email");
    console.log("💾 Failed email logged to database");
};