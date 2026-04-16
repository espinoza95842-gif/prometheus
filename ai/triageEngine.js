export function triageEmail(email) {

  const urgentKeywords = ["urgent", "asap", "important", "immediately"];

  const isUrgent = urgentKeywords.some(word =>
    email.subject.toLowerCase().includes(word)
  );

  return {
    priority: isUrgent ? "HIGH" : "NORMAL",
    suggestedAction: isUrgent ? "notify_user" : "add_to_inbox_queue"
  };

}
