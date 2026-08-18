import React, { useState, useRef } from 'react';
import {
  Camera,
  Upload,
  Link,
  Sparkles,
  Check,
  X,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  User as UserIcon,
  CheckCircle2
} from 'lucide-react';
import { AVATAR_PRESETS, processAvatarImageFile, AvatarPreset } from './avatarPresets';

export interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar?: string;
  userName?: string;
  onSaveAvatar: (newAvatarUrl: string) => void;
  theme?: 'dark' | 'light' | string;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  userName = 'User',
  onSaveAvatar,
  theme = 'dark'
}) => {
  const isLight = theme === 'light';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedTab, setSelectedTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [previewAvatar, setPreviewAvatar] = useState<string>(
    currentAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'
  );
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = async (file?: File) => {
    if (!file) return;
    setUploadError('');
    setIsProcessing(true);
    try {
      const dataUrl = await processAvatarImageFile(file);
      setPreviewAvatar(dataUrl);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to process image file. Please choose a valid image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    setPreviewAvatar(customUrlInput.trim());
  };

  const handleSelectPreset = (preset: AvatarPreset) => {
    setPreviewAvatar(preset.url);
  };

  const handleSetInitialsAvatar = () => {
    const initials = userName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'DG';
    const svgAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      userName
    )}&background=0773BB&color=fff&size=200&bold=true`;
    setPreviewAvatar(svgAvatar);
  };

  const handleSave = () => {
    onSaveAvatar(previewAvatar);
    onClose();
  };

  const categories = ['All', 'Professional', 'Tech', 'Creative', '3D & Illustrated'];
  const filteredPresets =
    selectedCategory === 'All'
      ? AVATAR_PRESETS
      : AVATAR_PRESETS.filter((p) => p.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in">
      <div
        className={`rounded-2xl w-full max-w-xl shadow-2xl border flex flex-col max-h-[90vh] overflow-hidden ${
          isLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#16222F] border-[#233549] text-white'
        }`}
      >
        {/* Modal Header */}
        <div className={`p-4 sm:p-5 border-b flex items-center justify-between ${isLight ? 'border-slate-200' : 'border-[#233549]'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Update Profile Picture</h3>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Upload a photo, choose from corporate presets, or enter an image URL for <span className="font-semibold text-[#0773BB] dark:text-[#3BC0BB]">{userName}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Preview Bar */}
        <div
          className={`p-4 border-b flex items-center justify-between gap-4 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3.5">
            <div className="relative group">
              <img
                src={previewAvatar}
                alt="Profile Preview"
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-[#0773BB] shadow-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200';
                }}
              />
              <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-emerald-500 text-white shadow-xs">
                <Check className="w-3 h-3" />
              </div>
            </div>
            <div>
              <div className="text-xs font-bold flex items-center gap-2">
                <span>Selected Picture Preview</span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  READY
                </span>
              </div>
              <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Will be displayed across team spaces, task assignments, chat, and headers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSetInitialsAvatar}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
              isLight
                ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700'
                : 'bg-[#16222F] hover:bg-[#1E2E40] border-[#233549] text-slate-300'
            }`}
            title="Generate custom initials avatar"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#3BC0BB]" />
            <span>Initials</span>
          </button>
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-b px-4 gap-2 pt-2 ${isLight ? 'border-slate-200 bg-slate-100/50' : 'border-[#233549] bg-[#0A1018]'}`}>
          <button
            type="button"
            onClick={() => setSelectedTab('upload')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              selectedTab === 'upload'
                ? 'border-[#0773BB] text-[#0773BB] dark:text-[#3BC0BB]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Photo</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('presets')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              selectedTab === 'presets'
                ? 'border-[#0773BB] text-[#0773BB] dark:text-[#3BC0BB]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Avatar Presets ({AVATAR_PRESETS.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedTab('url')}
            className={`px-3.5 py-2 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              selectedTab === 'url'
                ? 'border-[#0773BB] text-[#0773BB] dark:text-[#3BC0BB]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            <span>Image URL</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 max-h-[360px]">
          {/* TAB 1: UPLOAD PHOTO */}
          {selectedTab === 'upload' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                  isDragging
                    ? 'border-[#3BC0BB] bg-[#0773BB]/10'
                    : isLight
                    ? 'border-slate-300 hover:border-[#0773BB] bg-slate-50/50 hover:bg-slate-50'
                    : 'border-slate-700 hover:border-[#3BC0BB] bg-[#0D1520]/50 hover:bg-[#0D1520]'
                }`}
              >
                <div className="p-3.5 rounded-2xl bg-[#0773BB]/20 text-[#3BC0BB] border border-[#0773BB]/30">
                  <Upload className="w-6 h-6 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <p className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    Click to browse or drag & drop profile image here
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Supports JPG, PNG, WEBP, GIF, SVG. Automatically optimized & cropped for fast loading.
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-1.5 rounded-xl text-xs font-bold bg-[#0773BB] hover:bg-[#0663a1] text-white shadow-md transition-all pointer-events-none"
                >
                  Choose File from Computer
                </button>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-xs text-[#3BC0BB]">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Optimizing and resizing image...</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: AVATAR PRESETS */}
          {selectedTab === 'presets' && (
            <div className="space-y-3.5">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#0773BB] text-white shadow-xs'
                        : isLight
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        : 'bg-[#0D1520] hover:bg-[#1E2E40] text-slate-300 border border-[#233549]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Presets Grid */}
              <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 pt-1">
                {filteredPresets.map((preset) => {
                  const isSelected = previewAvatar === preset.url;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`relative group rounded-xl p-1 border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-[#0773BB] ring-2 ring-[#0773BB]/40 bg-[#0773BB]/10'
                          : isLight
                          ? 'border-slate-200 hover:border-slate-400 bg-white'
                          : 'border-[#233549] hover:border-slate-500 bg-[#0D1520]'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        className="w-14 h-14 rounded-lg object-cover"
                      />
                      <span className="text-[10px] font-medium text-slate-400 truncate w-full text-center px-0.5">
                        {preset.name.split(' ')[0]}
                      </span>

                      {isSelected && (
                        <div className="absolute top-1 right-1 p-0.5 rounded-full bg-[#0773BB] text-white shadow-xs">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CUSTOM IMAGE URL */}
          {selectedTab === 'url' && (
            <div className="space-y-4">
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                  Direct Image URL (HTTPS)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className={`flex-1 text-xs rounded-xl p-2.5 border font-mono focus:outline-none focus:border-[#0773BB] ${
                      isLight ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-[#0D1520] border-[#233549] text-white'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={handleApplyCustomUrl}
                    className="px-4 py-2 bg-[#0773BB] hover:bg-[#0663a1] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                  >
                    Preview
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Paste any public direct link to an avatar image (e.g. Unsplash, GitHub, Gravatar, Cloudinary, AWS S3).
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions Footer */}
        <div className={`p-4 border-t flex items-center justify-between ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#233549] bg-[#0D1520]'}`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              isLight ? 'bg-slate-200 hover:bg-slate-300 text-slate-700' : 'bg-[#16222F] hover:bg-[#1E2E40] text-slate-300'
            }`}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-extrabold bg-gradient-to-r from-[#0773BB] to-[#3BC0BB] hover:opacity-90 text-white shadow-lg flex items-center gap-1.5 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Profile Picture</span>
          </button>
        </div>
      </div>
    </div>
  );
};
