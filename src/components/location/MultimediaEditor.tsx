
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/image-upload";
import { Input } from "@/components/ui/input";
import { File, Link, Image, Video } from "lucide-react";
import { getEmbedUrl } from "@/utils/videoUtils";

interface ContentBlock {
  type: 'text' | 'image' | 'video' | 'link';
  content: string;
}

interface MultimediaEditorProps {
  onChange: (content: ContentBlock[]) => void;
  value: ContentBlock[];
}

export const MultimediaEditor: React.FC<MultimediaEditorProps> = ({ onChange, value }) => {
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [linkLabel, setLinkLabel] = useState<string>("");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const addTextBlock = () => {
    onChange([...value, { type: 'text', content: '' }]);
  };

  const handleImageUpload = (imageUrls: string[]) => {
    const newBlocks = imageUrls.map(url => ({
      type: 'image' as const,
      content: url
    }));
    onChange([...value, ...newBlocks]);
  };

  const addVideoBlock = () => {
    if (videoUrl && getEmbedUrl(videoUrl)) {
      onChange([...value, { type: 'video', content: videoUrl }]);
      setVideoUrl("");
      setShowVideoInput(false);
    }
  };

  const addLinkBlock = () => {
    if (linkUrl) {
      onChange([...value, { 
        type: 'link', 
        content: JSON.stringify({ url: linkUrl, label: linkLabel || linkUrl })
      }]);
      setLinkUrl("");
      setLinkLabel("");
      setShowLinkInput(false);
    }
  };

  const updateBlockContent = (index: number, newContent: string) => {
    const newBlocks = [...value];
    newBlocks[index] = { ...newBlocks[index], content: newContent };
    onChange(newBlocks);
  };

  const removeBlock = (index: number) => {
    const newBlocks = value.filter((_, i) => i !== index);
    onChange(newBlocks);
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 mb-4 flex-wrap">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addTextBlock}
          className="h-8 px-2"
        >
          <File className="w-3.5 h-3.5 mr-1" />
          Text
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowVideoInput(!showVideoInput)}
          className="h-8 px-2"
        >
          <Video className="w-3.5 h-3.5 mr-1" />
          Video
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setShowLinkInput(!showLinkInput)}
          className="h-8 px-2"
        >
          <Link className="w-3.5 h-3.5 mr-1" />
          Link
        </Button>
        <ImageUpload
          images={[]}
          onImagesChange={(urls) => handleImageUpload(urls)}
          maxImages={10}
          renderButton={(onClick) => (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClick}
              className="h-8 px-2"
            >
              <Image className="w-3.5 h-3.5 mr-1" />
              Image
            </Button>
          )}
        />
      </div>

      {showVideoInput && (
        <div className="flex gap-2 items-center">
          <Input
            type="url"
            placeholder="Paste YouTube or Vimeo URL"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            className="flex-1"
          />
          <Button type="button" onClick={addVideoBlock}>Add</Button>
          <Button type="button" variant="ghost" onClick={() => setShowVideoInput(false)}>Cancel</Button>
        </div>
      )}

      {showLinkInput && (
        <div className="space-y-2">
          <Input
            type="text"
            placeholder="Link Label (optional)"
            value={linkLabel}
            onChange={(e) => setLinkLabel(e.target.value)}
          />
          <div className="flex gap-2 items-center">
            <Input
              type="url"
              placeholder="URL"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex-1"
            />
            <Button type="button" onClick={addLinkBlock}>Add</Button>
            <Button type="button" variant="ghost" onClick={() => setShowLinkInput(false)}>Cancel</Button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {value.map((block, index) => (
          <div key={index} className="relative group">
            {block.type === 'text' && (
              <textarea
                value={block.content}
                onChange={(e) => updateBlockContent(index, e.target.value)}
                className="w-full min-h-[100px] border rounded px-2 py-2"
                placeholder="Write something..."
              />
            )}
            {block.type === 'image' && (
              <div className="relative">
                <img 
                  src={block.content} 
                  alt="User uploaded content" 
                  className="w-full rounded-lg"
                />
              </div>
            )}
            {block.type === 'video' && getEmbedUrl(block.content) && (
              <div className="w-full aspect-video">
                <iframe
                  src={getEmbedUrl(block.content)}
                  className="w-full h-full rounded-lg"
                  allowFullScreen
                />
              </div>
            )}
            {block.type === 'link' && (
              <div className="p-2 border rounded-lg">
                {(() => {
                  const linkData = JSON.parse(block.content);
                  return (
                    <a 
                      href={linkData.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {linkData.label}
                    </a>
                  );
                })()}
              </div>
            )}
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removeBlock(index)}
            >
              ×
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
