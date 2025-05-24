
export interface ReviewCriterion {
  id: string;
  name: string;
  category: string;
  created_at?: string;
  updated_at?: string;
}

export interface CriteriaRatings {
  [criterionId: string]: number;
}
