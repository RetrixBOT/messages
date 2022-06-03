import { Connection, createConnection, Model, Schema } from 'mongoose';
import {config} from 'dotenv';
config();

const dbCfg = {
    "username": process.env.DATABASE_USERNAME!,
    "password": process.env.DATABASE_PASSWORD!,
    "hostname": process.env.DATABASE_HOST!,
}

export interface IMessage {
    messageId: string,
    messageText: string,
    userId: string,
    userNickname?: string
    timestamp: number
}

const messageSchema = new Schema<IMessage>({
    messageId: {
        type: String,
        required: true
    },
    messageText: {
        type: String,
        required: true
    },
    userId: {
        type: String,
        requiredd: true
    },
    userNickname: {
        type: String,
        required: false
    },
    timestamp: {
        type: Number,
        required: true
    }
})

export class Database {
    private connection: Connection;
    private MessageModel: Model<IMessage>;

    constructor(channelId:string) {
        const url = `mongodb+srv://${dbCfg.username}:${dbCfg.password}@${dbCfg.hostname}/${channelId}?retryWrites=true&w=majority`;
        console.log(url);
        this.connection = createConnection(url);
        this.MessageModel = this.connection.model<IMessage>('Message',messageSchema);
    }

    public async close(){
        return this.connection.close();
    }

    public async getVodMessages(startTime:number,endTime: number): Promise<IMessage[]>{
        let messages = (await this.MessageModel.find({timestamp: {$gte:startTime, $lte: endTime}}).exec()).map(v => v.toObject());
        //await Promise.all((await this.MessageModel.find({timestamp: {$gte: startTime,$lte:endTime}}).exec())
        return messages;
    }

}