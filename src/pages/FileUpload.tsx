import { useState } from 'react';
import { TailSpin } from 'react-loader-spinner';
import UploadIcon from '../assets/upload.svg';
import DeleteIcon from '../assets/delete.svg';
import DropDown from '../assets/DropDown.svg';
import { uploadImage, uploadVideo } from '../services/api';
import '../styles/FileUpload.css';

const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processComplete, setProcessComplete] = useState(false);
  const [error, setError] = useState("");
  const [toggledViewIndex, setToggledViewIndex] = useState<number | null>(null);
  const [fileResults, setFileResults] = useState<{ filename: string; fileUrl: string; timeTaken: number }[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ [key: number]: string }>({});
  const [processingFiles, setProcessingFiles] = useState<Set<number>>(new Set());

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setError("");

    const selectedFiles = event.target.files;
    if (selectedFiles) {
      const validFiles = Array.from(selectedFiles).filter(file =>
        file.type.startsWith('image/') || file.type.startsWith('video/')
      );

      setFiles(prevFiles => {
        const newFiles = [...prevFiles, ...validFiles];

        const newPreviews = validFiles.reduce((acc, file, index) => {
          const objectURL = URL.createObjectURL(file);
          acc[prevFiles.length + index] = objectURL;
          return acc;
        }, {} as { [key: number]: string });

        setFilePreviews(prevPreviews => ({ ...prevPreviews, ...newPreviews }));
        return newFiles;
      });
    }
  };

  const handleDeleteFile = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedResults = fileResults.filter((_, i) => i !== index);

    const updatedPreviews = Object.keys(filePreviews)
      .filter(key => parseInt(key) !== index)
      .reduce((acc, key) => {
        const numKey = parseInt(key, 10);
        const newIndex = numKey > index ? numKey - 1 : numKey;
        acc[newIndex] = filePreviews[numKey];
        return acc;
      }, {} as { [key: number]: string });

    URL.revokeObjectURL(filePreviews[index]);

    setFiles(updatedFiles);
    setFileResults(updatedResults); 
    setFilePreviews(updatedPreviews); 

    if (toggledViewIndex === index) {
      setToggledViewIndex(null);
    } else if (toggledViewIndex && toggledViewIndex > index) {
      setToggledViewIndex(toggledViewIndex - 1);
    }
  };

  const handleProcessFiles = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file before processing.');
      return;
    }

    setIsProcessing(true);
    setError("");
    let resultsArray = [];

    try {
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        setProcessingFiles(prev => new Set(prev.add(index)));

        let result;
        if (file.type.startsWith('image/')) {
          result = await uploadImage(file);
        } else if (file.type.startsWith('video/')) {
          result = await uploadVideo(file);
        }

        const fileUrl = result?.fileUrl || '';
        const fileResult = {
          filename: file.name,
          fileUrl: fileUrl,
          timeTaken: result?.timeTaken || 0,
        };

        console.log(`File Name: ${file.name}`);
        console.log(`File URL: ${fileUrl}`);
        console.log(`File Type: ${file.type}`);
        
        resultsArray.push(fileResult);
        setFileResults(prevResults => [...prevResults, fileResult]);

        setProcessingFiles(prev => {
          const updated = new Set(prev);
          updated.delete(index);
          return updated;
        });
      }

      setProcessComplete(true);
    } catch (error) {
      setError('An error occurred while processing the files. Please try again.');
      setIsProcessing(false);
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setIsProcessing(false);
    setFiles([]);
    setProcessComplete(false);
    setError("");
    setToggledViewIndex(null);
    setFileResults([]);

    Object.values(filePreviews).forEach(url => URL.revokeObjectURL(url));
    setFilePreviews({});

    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const toggleFileDetails = (index: number) => {
    setToggledViewIndex(prevIndex => (prevIndex === index ? null : index));
  };

  return (
    <div className="container">
      <div className="upload-box">
        <img src={UploadIcon} alt="upload" />
        <div className="upload-text">Upload your files here</div>
        <input
          id="file-input"
          className="file-input"
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileChange}
          disabled={isProcessing || processComplete}
        />
        <label htmlFor="file-input" className="file-label">Browse</label>
      </div>
      <h2 className='file-upload-h2'>Uploading Files</h2>
      <div className='file-list'>
        {files.map((file, index) => (
          <div className="file-item" key={index}>
            <div className="file-info" style={{ marginTop: toggledViewIndex === index ? '10px' : '0' }}>
              <div className="file-name">
                {file.type.startsWith('image/') ? (
                  <img src={filePreviews[index]} alt="file preview" className="file-icon" />
                ) : (
                  <video src={filePreviews[index]} className="file-icon" controls />
                )}
                <div className="file-details">
                  <div className='file-description'>{file.name}</div>
                  {processingFiles.has(index) ? (
                    <TailSpin
                      height="20"
                      width="20"
                      color="#000000"
                      ariaLabel="loading"
                    />
                  ) : <div className="file-size">{Math.round(file.size / 1024)} KB</div>}
                </div>
              </div>
              <div className='file-options'>
                {fileResults[index] && <img className='drop-down' src={DropDown} onClick={() => toggleFileDetails(index)} />}
                {!isProcessing && (
                  <img src={DeleteIcon} className="delete-button" onClick={() => handleDeleteFile(index)} alt="delete" />
                )}
              </div>
            </div>
            {toggledViewIndex === index && fileResults[index]?.fileUrl && (
              <div className='response-text'>
                {file.type.startsWith('image/') ? (
                  <img src={fileResults[index].fileUrl} alt="processed file" className="processed-file" />
                ) : (
                  <video src={fileResults[index].fileUrl} controls className="processed-file">
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className='buttons-container'>
        {!processComplete && (
          <div className='buttons-container'>
            <button className="action-button process-button" onClick={handleProcessFiles}>
              {isProcessing ? (
                <span className="loader">
                  <TailSpin
                    height="20"
                    width="20"
                    color="#FFFFFF"
                    ariaLabel="loading"
                  />
                </span>
              ) : (
                'Process'
              )}
            </button>
            {error && <div className="error-message">{error}</div>}
          </div>
        )}
        {processComplete && (
          <div className='buttons-container'>
            <button className="action-button process-button" onClick={handleClear}>
              Clear All
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
