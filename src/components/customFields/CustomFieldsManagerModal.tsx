import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Sliders,
  Check,
  Type,
  Hash,
  List,
  CheckSquare,
  Star,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CustomFieldDefinition, CustomFieldType } from '../../types';

interface CustomFieldsManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CustomFieldsManagerModal: React.FC<CustomFieldsManagerModalProps> = ({
  isOpen,
  onClose
}) => {
  const { customFields, addCustomField, updateCustomField, deleteCustomField, theme } = useApp();
  const isLight = theme === 'light';

  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('text');
  const [description, setDescription] = useState('');
  const [optionsStr, setOptionsStr] = useState('');
  const [required, setRequired] = useState(false);
  const [defaultValue, setDefaultValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setEditingFieldId(null);
    setName('');
    setType('text');
    setDescription('');
    setOptionsStr('');
    setRequired(false);
    setDefaultValue('');
    setError(null);
  };

  const handleStartEdit = (field: CustomFieldDefinition) => {
    setEditingFieldId(field.id);
    setName(field.name);
    setType(field.type);
    setDescription(field.description || '');
    setOptionsStr(field.options ? field.options.join(', ') : '');
    setRequired(!!field.required);
    setDefaultValue(field.defaultValue !== undefined ? String(field.defaultValue) : '');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Field name is required');
      return;
    }

    const parsedOptions =
      type === 'dropdown'
        ? optionsStr
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean)
        : undefined;

    if (type === 'dropdown' && (!parsedOptions || parsedOptions.length === 0)) {
      setError('Please provide at least one dropdown option (comma-separated)');
      return;
    }

    let finalDefault: any = defaultValue;
    if (type === 'number') {
      finalDefault = defaultValue ? Number(defaultValue) : undefined;
    } else if (type === 'checkbox') {
      finalDefault = defaultValue === 'true';
    } else if (type === 'rating') {
      finalDefault = defaultValue ? Number(defaultValue) : 0;
    }

    if (editingFieldId) {
      updateCustomField(editingFieldId, {
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        options: parsedOptions,
        required,
        defaultValue: finalDefault
      });
    } else {
      addCustomField({
        name: name.trim(),
        type,
        description: description.trim() || undefined,
        options: parsedOptions,
        required,
        defaultValue: finalDefault
      });
    }

    handleResetForm();
  };

  const getTypeIcon = (fType: CustomFieldType) => {
    switch (fType) {
      case 'number':
        return <Hash className="w-3.5 h-3.5 text-cyan-400" />;
      case 'dropdown':
        return <List className="w-3.5 h-3.5 text-amber-400" />;
      case 'checkbox':
        return <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />;
      case 'rating':
        return <Star className="w-3.5 h-3.5 text-yellow-400" />;
      case 'date':
        return <Calendar className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Type className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#121B26] border-[#233549]'
        }`}
      >
        {/* Header */}
        <div
          className={`p-5 border-b flex items-center justify-between ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#16222F] border-[#233549]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#3BC0BB]/15 border border-[#3BC0BB]/30 text-[#3BC0BB]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Custom Fields Manager
              </h2>
              <p className="text-xs text-slate-400">
                Define lightweight custom metadata fields available across your project tasks & tables
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Active Fields List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Configured Custom Fields ({customFields.length})
            </h3>
            {customFields.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-slate-700/60 text-slate-500 text-xs">
                No custom fields defined yet. Create your first custom field below.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {customFields.map((field) => (
                  <div
                    key={field.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      editingFieldId === field.id
                        ? 'border-[#3BC0BB] bg-[#3BC0BB]/10'
                        : isLight
                        ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                        : 'bg-[#16222F]/70 border-[#233549] hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(field.type)}
                          <span className={`font-bold text-xs truncate ${isLight ? 'text-slate-900' : 'text-white'}`}>
                            {field.name}
                          </span>
                          {field.required && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 font-semibold">
                              Req
                            </span>
                          )}
                        </div>
                        {field.description && (
                          <p className="text-[11px] text-slate-400 truncate">{field.description}</p>
                        )}
                        {field.options && field.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {field.options.slice(0, 3).map((opt) => (
                              <span
                                key={opt}
                                className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20"
                              >
                                {opt}
                              </span>
                            ))}
                            {field.options.length > 3 && (
                              <span className="text-[10px] text-slate-500">
                                +{field.options.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleStartEdit(field)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors"
                          title="Edit field definition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCustomField(field.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete field"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create or Edit Form */}
          <div
            className={`p-4 rounded-xl border ${
              isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-[#0D1520] border-[#233549]'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xs font-bold uppercase tracking-wider ${isLight ? 'text-slate-900' : 'text-white'}`}>
                {editingFieldId ? 'Edit Custom Field' : 'Add New Custom Field'}
              </h3>
              {editingFieldId && (
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel Edit
                </button>
              )}
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Field Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Field Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Cost Center, QA Signoff, Vendor ID"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#16222F] border-[#233549] text-white'
                    }`}
                  />
                </div>

                {/* Field Type */}
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Field Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CustomFieldType)}
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] cursor-pointer ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#16222F] border-[#233549] text-white'
                    }`}
                  >
                    <option value="text">Text (Single Line / String)</option>
                    <option value="number">Number (Numeric / Currency)</option>
                    <option value="dropdown">Dropdown (Selectable Options)</option>
                    <option value="checkbox">Checkbox (Boolean Yes/No)</option>
                    <option value="rating">Rating (1 to 5 Stars)</option>
                    <option value="date">Date (Calendar Picker)</option>
                  </select>
                </div>
              </div>

              {/* Options for Dropdown */}
              {type === 'dropdown' && (
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Dropdown Options (comma separated) <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={optionsStr}
                    onChange={(e) => setOptionsStr(e.target.value)}
                    placeholder="e.g. Low, Medium, High, Critical"
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#16222F] border-[#233549] text-white'
                    }`}
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  Description / Help Tooltip
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Accounting ledger code used for SAP reconciliation"
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] ${
                    isLight
                      ? 'bg-white border-slate-300 text-slate-900'
                      : 'bg-[#16222F] border-[#233549] text-white'
                  }`}
                />
              </div>

              {/* Default Value and Required Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Default Initial Value (Optional)
                  </label>
                  <input
                    type="text"
                    value={defaultValue}
                    onChange={(e) => setDefaultValue(e.target.value)}
                    placeholder={
                      type === 'checkbox'
                        ? 'true or false'
                        : type === 'number'
                        ? '100'
                        : 'Default value'
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-[#3BC0BB] ${
                      isLight
                        ? 'bg-white border-slate-300 text-slate-900'
                        : 'bg-[#16222F] border-[#233549] text-white'
                    }`}
                  />
                </div>

                <div className="pt-4 flex items-center gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={required}
                      onChange={(e) => setRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-[#3BC0BB] focus:ring-0 cursor-pointer"
                    />
                    <span>Mark as Required Field</span>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0773BB] hover:bg-[#0773BB]/80 text-white text-xs font-bold shadow-lg shadow-[#0773BB]/25 transition-all flex items-center gap-2 active:scale-95"
                >
                  {editingFieldId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  <span>{editingFieldId ? 'Save Changes' : 'Create Custom Field'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
