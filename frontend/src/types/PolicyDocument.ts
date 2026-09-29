export interface PolicyDocument {
  id: number;
  title: string;
  version_label: string;
  raw_text: string;
  /** 自动分段后用于匹配的稳定键，JSON 序列化的 section_key 列表 */
  normalized_sections: string;
  imported_at: string;
}
