import axios from 'axios';
import { RestAPI, Sort, VideoFilterType } from 'booyapi';
import {config} from 'dotenv';
config();

import { Database } from './database';
import { promises as fs } from 'fs'
const SESSION_KEY = process.env.SESSION_KEY!;
  
let errors: string[]= [];
let tasks: string[] = [];

const addTask = (tasks:string[],task:string): string[]=> {
    console.log(task);
    return tasks.concat([task]);
}

const addError = (errors: string[],error: string): string[] => {
    console.log(error);
    return errors.concat([error]);
}

const updateChannel = async (channelId: string) => {

    const database = new Database(channelId);
    
    const channel = await RestAPI.channels.getItem(channelId,SESSION_KEY);
    let playbacks = await RestAPI.playbacks.get(channelId,0,100,VideoFilterType.VOD,SESSION_KEY,undefined,undefined,Sort.CREATE_TIME_DESC);
    
    while (playbacks.cursor != 0){
        const newP = await RestAPI.playbacks.get(channelId,playbacks.cursor,100,VideoFilterType.VOD,SESSION_KEY,undefined,undefined,Sort.CREATE_TIME_DESC);
        playbacks.playbackList = playbacks.playbackList.concat(newP.playbackList);
        playbacks.cursor = newP.cursor;
    }

    let playbacksList = playbacks.playbackList.map(p => p.playback);

    const existingVods = await getVodChats(channelId);

    for (let i = 0; i<playbacksList.length;i++){
        let playback = playbacksList[i];
        if (!existingVods.includes(`${channelId}-${playback.uuid}.json`)){
            try{            
                const messages = await database.getVodMessages(playback.createTimeMs,playback.updateTimeMs);
                const fileData = JSON.stringify({count: messages.length, messages});
                const fileName = `${channelId}-${playback.uuid}.json`;
                await uploadVodChat(fileName,fileData);
                tasks = addTask(tasks,`${channelId}-${playback.uuid}.json Generado`);
            }
            catch (error){
                errors = addError(errors,`Error al generar o obtener mensajes ${JSON.stringify(error)}`)
            }
        }
    }
    for (let i = 0; i< existingVods.length;i++){
        let filename = existingVods[i];
        if (!playbacksList.some((p)=> `${channelId}-${p.uuid}.json` == filename)){
            try {
            await deleteVodChat(filename);
            tasks = addTask(tasks,filename+" Eliminado");
            }
            catch (error) {
            errors = addError(errors,"Error al eliminar "+ JSON.stringify(error));
            }
        }
    }
    await database.close();
}

async function getVodChats(channelId: string): Promise<string[]> {
    const files = (await fs.readdir('./messages')).filter(f => f.startsWith(channelId));
    return files;

}

async function uploadVodChat(fileName: string, fileData: string) {
    await fs.writeFile(`./messages/${fileName}`,fileData);
}

async function deleteVodChat(filename: string) {
    await fs.rm(`./messages/${filename}`);
}
updateChannel('71333286');