const supabase = require('../config/supabaseClient');

// 1. Create a new Chat Session
const createSession = async (userId, title) => {
    const { data, error } = await supabase
                                          .from('chat_sessions')
                                          .insert([{ user_id:userId, title:title }])
                                          .select()
                                          .single();

    if (error) throw error;
    return data;
}


// 2. Add message to the database
const addMessage = async (sessionId, role, content) => {
    const { data, error } = await supabase
                                          .from('messages')
                                          .insert([{ session_id:sessionId, role:role, content:content }])
                                          .select()
                                          .single();
    if (error) throw error;
    return data;
}

// 3. Get history for the AI cpntext (Sliding window)
const getSessionHistory = async (sessionId, limit=20) => {
    const { data, error } = await supabase
                                          .from('messages')
                                          .select('role', 'content')
                                          .eq('session_id', sessionId)
                                          .order('created_at', { ascending: false })
                                          .limit(limit);
    if (error) throw error;
    return data.reverse(); // Reverse to maintain chronological order
}

module.exports = { createSession, addMessage, getSessionHistory };