const supabase = require('../config/supabaseClient');


// Tool 1: Add a task 
const addTask = async (userId, taskContent, dueDate=null) => {
    const newTask = {
        user_id: userId,
        content: taskContent,
        is_completed: false,
    };

    if (dueDate) {
        newTask.due_date = dueDate;
    }

    const { data, error } =  await supabase
                                          .from('tasks')
                                          .insert([newTask])
                                          .select()
                                          .single();

    if (error) throw error;
    
    // Formatting the output message
    const dateInfo = data.due_date 
        ? ` (Due: ${new Date(data.due_date).toLocaleString()})` 
        : '';

    return  `Task added: "${data.content}"${dateInfo} (ID: ${data.id})`;
};


// Tool 2: Listing pending tasks
const listTasks = async (userId) => {
    const { data, error } = await supabase
                                        .from('tasks')
                                        .select('id, content, created_at, due_date')
                                        .eq('user_id', userId)
                                        .eq('is_completed', false)
                                        .order('created_at', {ascending: true});

    if (error) throw error;

    if (data.length === 0) {
        return 'Youhave no pending tasks.';
    }

    return data.map(t => {
        const dateStr = t.due_date 
            ? ` [Due: ${new Date(t.due_date).toLocaleDateString()}]` 
            : '';
        return `- [${t.id}] ${t.content} ${dateStr}`;
    }).join("\n");
};


// Tool 3: Complete a task

const completeTask = async (userId, taskId) => {
    const { data, error } = await supabase
                                          .from('tasks')
                                          .update({'is_completed': true})
                                          .eq('id', taskId)
                                          .eq('user_id', userId)
                                          .select();
    if (error) throw error;

    if (data.length===0) {
        return `Error: Task with ID ${taskId} not found or already completed`;
    }

    return `Task marked as completed: "${data[0].content}"`;
};

module.exports = { addTask, listTasks, completeTask };