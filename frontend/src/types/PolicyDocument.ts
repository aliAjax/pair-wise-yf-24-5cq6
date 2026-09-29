export interface PolicyDocument {
  id: number;
  title: string;
  version_label: string;
  raw_text: string;
  /** 导入时解析出的条款数量快照，用于列表展示 */
  normalized_sections: number;
  imported_at: string;
}
