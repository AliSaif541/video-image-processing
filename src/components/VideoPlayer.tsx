import React, { useEffect } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

const VideoPlayer: React.FC<{ src: string }> = ({ src }) => {
  const videoRef = React.useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      const player = videojs(videoRef.current, {
        controls: true,
        autoplay: false,
        preload: 'auto',
      });

      player.src({ type: 'video/x-matroska', src });

      return () => {
        player.dispose();
      };
    }
  }, [src]);

  return (
    <div data-vjs-player>
      <video ref={videoRef} className="video-js vjs-default-skin" />
    </div>
  );
};

export default VideoPlayer;
