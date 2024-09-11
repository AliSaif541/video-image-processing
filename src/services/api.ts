import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

interface UploadResult {
  fileUrl: string;
  timeTaken: number;
}

async function uploadImage(imageFile: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', imageFile);

  const startTime = Date.now();

  try {
    const response = await axios.post(`${apiBaseUrl}/process-image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'blob',
    });

    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    const fileUrl = URL.createObjectURL(response.data);

    return { fileUrl, timeTaken };
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

async function uploadVideo(videoFile: File): Promise<UploadResult> {
  const formData = new FormData();
  formData.append('file', videoFile);
  const startTime = Date.now();

  try {
    const response = await axios.post(`${apiBaseUrl}/process-video`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      responseType: 'arraybuffer', 
    });
    const endTime = Date.now();
    const timeTaken = endTime - startTime;

    const blob = new Blob([response.data], { type: 'video/mp4' });
    const fileUrl = URL.createObjectURL(blob);
    return { fileUrl, timeTaken };
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
}

export { uploadImage, uploadVideo };