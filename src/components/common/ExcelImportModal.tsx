import React from 'react';
import { DataImportModal } from './DataImportModal';

export interface ExcelImportModalProps {
  onClose: () => void;
  defaultProjectId?: string;
  defaultSpaceId?: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  onClose,
  defaultProjectId,
  defaultSpaceId
}) => {
  return (
    <DataImportModal
      onClose={onClose}
      defaultProjectId={defaultProjectId}
      defaultSpaceId={defaultSpaceId}
    />
  );
};

export { DataImportModal };
