
import mongoose, { Schema, model, models } from 'mongoose';

const TemplateSchema = new Schema({
  name: { type: String, required: true },
  mainImage: { type: String, required: true },
  category: { type: String, required: true },
  label: { type: String, default: 'Công cụ AI' }, 
  color: { type: String, default: 'bg-blue-500' }, 
  modelId: { type: String, required: true },
  variants: [{ type: String }],
  isHot: { type: Boolean, default: false },
  configParams: { type: String, default: '{}' }, 
  
  createdAt: { type: Date, default: Date.now }
});

const Template = models.Template || model('Template', TemplateSchema);

export default Template;
