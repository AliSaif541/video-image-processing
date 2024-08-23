import { useState } from 'react';
import { TailSpin } from 'react-loader-spinner';
import UploadIcon from '../assets/upload.svg';
import DeleteIcon from '../assets/delete.svg';
import DropDown from '../assets/DropDown.svg';
import { uploadImage, uploadVideo } from '../services/api';
import '../styles/FileUpload.css';

const FileUpload: React.FC = () => {
  const [files, setFiles] = useState<File[]>([]);
  const [csvData, setCsvData] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processComplete, setProcessComplete] = useState(false);
  const [error, setError] = useState("");
  const [toggledViewIndex, setToggledViewIndex] = useState<number | null>(null);
  const [fileResults, setFileResults] = useState<{ filename: string, fileClass: string, timeTaken: number }[]>([]);
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
    setFiles(updatedFiles);

    if (toggledViewIndex === index) {
      setToggledViewIndex(null);
    }

    URL.revokeObjectURL(filePreviews[index]);
    setFilePreviews(prevPreviews => {
      const updatedPreviews = { ...prevPreviews };
      delete updatedPreviews[index];
      return updatedPreviews;
    });
  };

  const handleProcessFiles = async () => {
    if (files.length === 0) {
      setError('Please upload at least one file before processing.');
      return;
    }
  
    setIsProcessing(true);
    setError("");
    let resultsArray = [];
  
    let imageContentCount = 0;
    let imageCoverageCount = 0;
    let videoContentCount = 0;
    let videoCoverageCount = 0;
  
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
  
        const fileClass = result?.fileClass || 'Unknown';
        const fileResult = {
          filename: file.name,
          filetype: file.type,
          fileClass: fileClass,
          timeTaken: result?.timeTaken || 0,
        };
        resultsArray.push(fileResult);
        setFileResults(prevResults => [...prevResults, fileResult]);
  
        if (file.type.startsWith('image/')) {
          if (fileClass === 'storytelling') {
            imageContentCount++;
          } else if (fileClass === 'coverage') {
            imageCoverageCount++;
          }
        } else if (file.type.startsWith('video/')) {
          if (fileClass === 'storytelling-videos') {
            videoContentCount++;
          } else if (fileClass === 'coverage-videos') {
            videoCoverageCount++;
          }
        }
  
        setProcessingFiles(prev => {
          const updated = new Set(prev);
          updated.delete(index);
          return updated;
        });
      }
  
      const csvContent = resultsArray.map(result =>
        `${result.filename},${result.filetype},${result.fileClass},${result.timeTaken}`
      ).join('\n');
  
      const classificationSummary = `\n\nImage Content: ${imageContentCount},Image Coverage: ${imageCoverageCount}\nVideo Content: ${videoContentCount},Video Coverage: ${videoCoverageCount}`;
  
      const csvHeader = "Filename,Filetype,Class,Time taken (ms)\n";
      setCsvData(csvHeader + csvContent + classificationSummary);
      setProcessComplete(true);
    } catch (error) {
      setError('An error occurred while processing the files. Please try again.');
      console.error('Error processing files:', error);
    } finally {
      setIsProcessing(false);
    }
  };
  

  const handleDownloadCSV = () => {
    if (!csvData) return;

    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'file_results.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClear = () => {
    setIsProcessing(false);
    setFiles([]);
    setProcessComplete(false);
    setCsvData(null);
    setError("");
    setToggledViewIndex(null);

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
          disabled={isProcessing}
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
                    <video src={filePreviews[index]} className="file-icon" />
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
                      ) : <div className="file-size">{Math.round(file.size / 1024)} KB</div>
                    }
                </div>
              </div>
              <div className='file-options'>
                {fileResults[index] && <img className='drop-down' src={DropDown} onClick={() => toggleFileDetails(index)} />}
                {!isProcessing && (
                  <img src={DeleteIcon} className="delete-button" onClick={() => handleDeleteFile(index)} alt="delete" />
                )}
              </div>
            </div>
            {toggledViewIndex === index && (
              <div className='response-text'>
                <p>
                  <span className='response-heading'>Class:</span> {fileResults[index]?.fileClass}
                </p>
                <p>
                  <span className='response-heading'>Time Taken:</span> {fileResults[index]?.timeTaken}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className='buttons-container'>
        {!processComplete &&
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
        }
        {processComplete && (
          <div className='buttons-container'>
            <button className="action-button download-button" onClick={handleDownloadCSV}>
              Download CSV/Excel
            </button>
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
