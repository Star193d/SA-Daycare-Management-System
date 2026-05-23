import React, { useState } from 'react';
import { StateService } from '../lib/services/StateService';
import { Parent, CommunicationMessage } from '../lib/types';
import { maskSAId } from '../lib/utils';
import { MessageSquare, Send, Bell, Mail, ShieldAlert, CheckCircle } from 'lucide-react';

interface CommsTabProps {
  stateService: StateService;
}

export const CommsTab: React.FC<CommsTabProps> = ({ stateService }) => {
  const [messages, setMessages] = useState<CommunicationMessage[]>(stateService.communications);
  const [parents, setParents] = useState<Parent[]>(stateService.parents);

  // Selector form state
  const [formMsg, setFormMsg] = useState({
    parentId: stateService.parents[0]?.id || '',
    title: '',
    body: '',
    type: 'Email' as 'Email' | 'PushNotification' | 'SMS'
  });

  const [feedback, setFeedback] = useState<string>('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');

    if (!formMsg.title.trim() || !formMsg.body.trim()) {
      setFeedback('You must enter a title and text body for the notification.');
      return;
    }

    const parent = stateService.parents.find(p => p.id === formMsg.parentId);
    if (!parent) {
      setFeedback('You must select a valid parent recipient.');
      return;
    }

    const sent = stateService.logCommunication({
      parentId: parent.id,
      title: formMsg.title.trim(),
      body: formMsg.body.trim(),
      type: formMsg.type
    });

    setMessages([...stateService.communications]);
    setFeedback(`Success! Message logged under communication sequence. Dispatching downstream clients...`);

    // Trigger deep links based on types
    const textToSend = `${formMsg.title}: ${formMsg.body}`;
    if (formMsg.type === 'SMS') {
      alert(`[SIMULATED TWILIO API CALL]\nTo: ${parent.phone}\nBody: ${textToSend}\nResponse status: 200 OK`);
    } else if (formMsg.type === 'PushNotification') {
      alert(`[PUSH WORKFLOW ACTIVATED]\nApplet pushes targeted FCM payload: "${formMsg.title}" to Parent App Instance.`);
    } else {
      // Email or WA (can open mailto:)
      const mailUrl = `mailto:${parent.email}?subject=${encodeURIComponent(formMsg.title)}&body=${encodeURIComponent(formMsg.body)}`;
      window.open(mailUrl, '_blank');
    }

    setFormMsg({
      parentId: parent.id,
      title: '',
      body: '',
      type: 'Email'
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Composer Form panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs h-fit space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <MessageSquare size={16} /> Notification Console
          </h3>

          <form onSubmit={handleSendMessage} className="space-y-4">
            {feedback && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-lg text-xxs font-semibold">
                {feedback}
              </div>
            )}

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Recipient Parent</label>
              {parents.length === 0 ? (
                <div className="text-xxs text-rose-600 bg-rose-50 p-2 border border-rose-150 rounded">
                  Create parent account first to activate notifications.
                </div>
              ) : (
                <select
                  value={formMsg.parentId}
                  onChange={e => setFormMsg({ ...formMsg, parentId: e.target.value })}
                  className="w-full text-xs border border-slate-300 bg-white rounded-lg px-3 py-2.5 outline-none"
                >
                  {parents.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} | Phone: {p.phone}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Dispatch Channel</label>
              <select
                value={formMsg.type}
                onChange={e => setFormMsg({ ...formMsg, type: e.target.value as any })}
                className="w-full text-xs border border-slate-300 bg-white rounded-lg px-3 py-2.5 outline-none"
              >
                <option value="Email">Secure Email (mailto)</option>
                <option value="PushNotification">Push Notifications (Mobile Applet)</option>
                <option value="SMS">SMS Gateway (Simulated Twilio)</option>
              </select>
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Message Subject / Title</label>
              <input
                required
                type="text"
                placeholder="e.g. Sipho missed porridge course"
                value={formMsg.title}
                onChange={e => setFormMsg({ ...formMsg, title: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xxs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notification Body Text</label>
              <textarea
                required
                rows={4}
                placeholder="e.g. Good day, please check Sipho's temperature today. He was marked as sick this morning."
                value={formMsg.body}
                onChange={e => setFormMsg({ ...formMsg, body: e.target.value })}
                className="w-full text-xs border border-slate-300 rounded-lg px-3 py-2.5 outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={parents.length === 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-semibold text-xs py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-1.5"
            >
              <Send size={12} /> Dispatch Notification
            </button>
          </form>
        </div>

        {/* Messaging History Log list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden h-fit">
          <div className="p-4 bg-slate-50 border-b border-slack-155 flex justify-between items-center">
            <h3 className="font-semibold text-sm text-slate-800">Dispatch Dispatching Logs Archive</h3>
            <span className="text-xxs text-slate-400 font-mono">Sent notification counts: {messages.length}</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-[480px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-12 font-sans">
                No outbound transmission items found.
              </p>
            ) : (
              messages.map(msg => {
                const parent = stateService.parents.find(p => p.id === msg.parentId);
                return (
                  <div key={msg.id} className="p-5 text-xs font-sans hover:bg-slate-50/40 transition-colors">
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-[13px]">{msg.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase font-bold tracking-wider ${
                          msg.type === 'Email' ? 'bg-indigo-100 text-indigo-800' :
                          msg.type === 'SMS' ? 'bg-teal-100 text-teal-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {msg.type}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(msg.dateSent).toLocaleDateString('en-ZA')} {new Date(msg.dateSent).toLocaleTimeString('en-ZA', {hour:'2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <p className="text-slate-650 leading-relaxed text-[11px] font-medium">{msg.body}</p>
                    <div className="mt-3 text-[10px] text-slate-400 font-semibold border-t border-slate-50 pt-2 flex justify-between">
                      <span>Ref Account: {parent ? `${parent.firstName} ${parent.lastName}` : 'N/A'}</span>
                      <span className="font-mono">ID: {parent ? maskSAId(parent.saIdNumber) : 'N/A'}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
