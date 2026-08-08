export interface Branch {
  _id: string;
  name: string;
  shortName: string;
  description?: string;
  icon?: string;
  isActive: boolean;
}

export interface Semester {
  _id: string;
  branchId: Branch | string;
  semNumber: number;
  title: string;
  price: number;
  thumbnail?: string;
  isPublished: boolean;
}

export interface Subject {
  _id: string;
  semesterId: string;
  name: string;
  subjectCode?: string;
  thumbnail?: string;
  orderSequence: number;
  isActive: boolean;
}

export type ContentType = 'video' | 'pdf' | 'notes';

export interface Content {
  _id: string;
  title: string;
  type: ContentType;
  category?: string;
  unit: string;
  duration?: string;
  isFree: boolean;
  orderSequence: number;
  isLocked: boolean;
  fileUrl: string | null;
  bunnyVideoId: string | null;
  bunnyLibraryId: string | null; // Which Bunny Stream library this video belongs to
  subjectId?: any;
}

export interface UnitGroup {
  unitName: string;
  contents: Content[];
}

export interface Banner {
  _id: string;
  imageUrl: string;
  actionUrl?: string;
  isActive: boolean;
}

export interface TrendingCourse extends Semester {
  branch: Branch;
}
