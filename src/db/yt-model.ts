import { Schema, model } from "mongoose";

export interface VideoSchemaTypes {
  title: string;
  channelName: string;
  description: string;
  watched: boolean;
  thumbnail?: string;
}

const VideoSchema = new Schema<VideoSchemaTypes>({
  title: { type: String, required: true },
  channelName: { type: String, required: true },
  description: { type: String, required: true },
  watched: { type: Boolean, default: false, required: true },
  thumbnail: { type: String, default: "https://via.placeholder.com/1600x900.webp", required: false },
});

const VideoModel = model("Video", VideoSchema);
export default VideoModel;
