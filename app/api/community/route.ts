import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import History from '@/models/History';
import User from '@/models/User'; 
export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    
    const { searchParams } = new URL(request.url);
    const queryText = searchParams.get('q');

    let filter: any = {};
    
    filter.resultImage = { $ne: null }; 

    if (queryText) {
        filter.prompt = { $regex: queryText, $options: 'i' };
    }

    
    const images = await History.find(filter)
      .sort({ createdAt: -1 }) 
      .limit(50) 
      .populate('userId', 'email clerkId'); 
    return NextResponse.json({ images });

  } catch (error) {
    return NextResponse.json({ error: "Lỗi lấy dữ liệu" }, { status: 500 });
  }
}