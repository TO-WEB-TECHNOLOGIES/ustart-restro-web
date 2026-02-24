import axios from 'axios';
import { api } from './axios';

export type RequirementType = 
    | 'restaurant_primary_image' 
    | 'restaurant_fssai' 
    | 'restaurant_delivery_menu';

export interface PresignedUrlRequest {
    fileNames: string[];
    requirementType: RequirementType;
}

export interface PresignedUrlResponse {
    fileName: string; // This is the S3 Key/Path returned by backend
    presignedUrl: string;
}

export const multimediaService = {
    /**
     * Get presigned URLs for uploading files.
     * POST /api/multimedia/presigned-urls
     */
    getPresignedUrls: async (payload: PresignedUrlRequest): Promise<PresignedUrlResponse[]> => {
        try {
            const response = await api.post<PresignedUrlResponse[]>('/api/multimedia/presigned-urls', payload);
            return response.data;
        } catch (error) {
            console.error('Error getting presigned URLs:', error);
            throw error;
        }
    },

    /**
     * Upload a file to S3 using a presigned URL.
     */
    uploadToS3: async (presignedUrl: string, file: File): Promise<void> => {
        try {
            await axios.put(presignedUrl, file, {
                headers: {
                    'Content-Type': file.type,
                },
            });
        } catch (error) {
            console.error('Error uploading to S3:', error);
            throw error;
        }
    },

    /**
     * Helper to handle the full upload workflow (get URL + upload).
     * Returns the S3 key and original fileName.
     */
    uploadRestaurantDoc: async (file: File, requirementType: RequirementType): Promise<{ key: string, fileName: string }> => {
        const responses = await multimediaService.getPresignedUrls({
            fileNames: [file.name],
            requirementType
        });
        
        if (!responses || responses.length === 0) {
            throw new Error('Failed to get presigned URL');
        }

        const { presignedUrl, fileName: s3Key } = responses[0];
        await multimediaService.uploadToS3(presignedUrl, file);
        return { key: s3Key, fileName: file.name };
    }
};

