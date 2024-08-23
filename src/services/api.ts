import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

interface VideoResponse {
  class: string;
}

interface ImageResponse {
  prediction: number;
}

interface UploadResult {
  fileClass: string;
  timeTaken: number;
}

async function uploadImage(imageFile: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('image', imageFile);

  const startTime = Date.now();

  try {
    const response = await axios.post<ImageResponse>(`${apiBaseUrl}/upload_image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    let fileClass = "";

    if (response.data.prediction === 0) {
        fileClass = "coverage";
    } else if (response.data.prediction === 1) {
        fileClass = "storytelling";
    }

    return { fileClass, timeTaken };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

async function uploadVideo(videoFile: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('video', videoFile);

  const startTime = Date.now();

  try {
    const response = await axios.post<VideoResponse>(`${apiBaseUrl}/upload_video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    return { fileClass: response.data.class, timeTaken };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
}


export { uploadImage, uploadVideo};