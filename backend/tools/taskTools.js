const { task } = require('@langchain/langgraph');
const supabase = require('../config/supabaseClient');


// Tool 1: Add a task 
const addTask = async (userId, taskContent, dueDate=null) => {
    console.log('Using the tool: addTask');
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
    console.log('Using the tool: listTasks');
    const { data, error } = await supabase
                                        .from('tasks')
                                        .select('id, content, is_completed, created_at, due_date')
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
    console.log('Using the tool: completeTask');
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

// Delete a task
const deleteTask = async (userId, taskId) => {
    const { error } = await supabase
                                    .from('tasks')
                                    .delete()
                                    .eq('id', taskId)
                                    .eq('user_id', userId);
    if (error) throw error;
    return true;
};

// Toggle task status (True <-> False)
const toggleTaskCompletion = async (userId, taskId, currentStatus) => {
    const { error } = await supabase
                                    .from('tasks')
                                    .update({ is_completed: !currentStatus })
                                    .eq('id', taskId)
                                    .eq('user_id', userId);
    if (error) throw error;
    return true;
}


module.exports = { addTask, listTasks, completeTask, deleteTask, toggleTaskCompletion };