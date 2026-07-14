'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { knowledgeApi, ticketApi, extractApiError } from '@/lib/api';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import type {
  Ticket,
  TicketAiSuggestion,
  TicketEvent,
  KnowledgeArticle,
  TicketMessage,
  TicketStatus,
} from '@/types/api';

interface TicketDetailProps {
  workspaceId: string;
  ticket: Ticket;
  messages: TicketMessage[];
  events: TicketEvent[];
}

export function TicketDetail({ workspaceId, ticket, messages, events }: TicketDetailProps) {
  const router = useRouter();
  const [currentTicket, setCurrentTicket] = useState(ticket);
  const [currentMessages, setCurrentMessages] = useState(messages);
  const [body, setBody] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'INTERNAL'>('PUBLIC');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<TicketAiSuggestion | null>(null);
  const [isGeneratingSuggestion, setIsGeneratingSuggestion] = useState(false);
  const [knowledgeDraft, setKnowledgeDraft] = useState<KnowledgeArticle | null>(null);
  const [isCreatingKnowledgeDraft, setIsCreatingKnowledgeDraft] = useState(false);
  const [isPublishingKnowledge, setIsPublishingKnowledge] = useState(false);
  const canCreateKnowledgeDraft =
    currentTicket.status === 'RESOLVED' || currentTicket.status === 'CLOSED';

  const addMessage = async () => {
    if (!body.trim()) return;
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await ticketApi.addMessage(workspaceId, currentTicket.id, {
        visibility,
        body,
      });
      setCurrentMessages((existing) => [...existing, response.data.message]);
      setBody('');
      router.refresh();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeStatus = async (status: TicketStatus) => {
    setError(null);
    setIsChangingStatus(true);
    try {
      const response = await ticketApi.changeStatus(workspaceId, currentTicket.id, { status });
      setCurrentTicket(response.data.ticket);
      router.refresh();
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsChangingStatus(false);
    }
  };

  const generateAiSuggestion = async () => {
    setError(null);
    setIsGeneratingSuggestion(true);
    try {
      const response = await ticketApi.generateSuggestions(workspaceId, currentTicket.id);
      setAiSuggestion(response.data.suggestion);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsGeneratingSuggestion(false);
    }
  };

  const createKnowledgeDraft = async () => {
    setError(null);
    setIsCreatingKnowledgeDraft(true);
    try {
      const response = await ticketApi.createKnowledgeDraft(workspaceId, currentTicket.id);
      setKnowledgeDraft(response.data.article);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsCreatingKnowledgeDraft(false);
    }
  };

  const publishKnowledgeDraft = async () => {
    if (!knowledgeDraft) return;
    setError(null);
    setIsPublishingKnowledge(true);
    try {
      const response = await knowledgeApi.publish(workspaceId, knowledgeDraft.id);
      setKnowledgeDraft(response.data.article);
    } catch (err) {
      setError(extractApiError(err));
    } finally {
      setIsPublishingKnowledge(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="space-y-4">
        {error && <Alert type="error" message={error} />}
        <div className="border border-gray-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs text-gray-500">{currentTicket.number}</p>
              <h1 className="mt-1 text-xl font-semibold text-gray-900">{currentTicket.title}</h1>
            </div>
            <span className="border border-gray-300 px-2 py-1 text-xs font-medium text-gray-700">
              {currentTicket.status}
            </span>
          </div>
          <p className="mt-4 whitespace-pre-wrap text-sm text-gray-700">
            {currentTicket.description}
          </p>
        </div>

        <div className="border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Conversation</h2>
          <div className="mt-4 space-y-3">
            {currentMessages.length === 0 ? (
              <p className="text-sm text-gray-500">No replies yet.</p>
            ) : (
              currentMessages.map((message) => (
                <div key={message.id} className="border border-gray-200 p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-gray-500">
                    <span>
                      {message.visibility === 'INTERNAL' ? 'Internal note' : 'Public reply'}
                    </span>
                    <span>{new Date(message.created_at).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-gray-800">{message.body}</p>
                </div>
              ))
            )}
          </div>

          <div className="mt-5 space-y-3">
            <textarea
              rows={4}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Write a reply or internal note"
            />
            <div className="flex items-center justify-between gap-3">
              <select
                value={visibility}
                onChange={(event) => setVisibility(event.target.value as 'PUBLIC' | 'INTERNAL')}
                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
              >
                <option value="PUBLIC">Public reply</option>
                <option value="INTERNAL">Internal note</option>
              </select>
              <Button type="button" onClick={addMessage} loading={isSubmitting}>
                Add message
              </Button>
            </div>
          </div>
        </div>
      </section>

      <aside className="space-y-4">
        <div className="border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">AI suggestion</h2>
          <p className="mt-1 text-xs text-gray-500">Draft only. It will not change this ticket.</p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full"
            onClick={generateAiSuggestion}
            loading={isGeneratingSuggestion}
          >
            Generate suggestion
          </Button>
          {aiSuggestion && (
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <div className="text-xs font-medium uppercase text-gray-500">Summary</div>
                <p className="mt-1 text-gray-800">{aiSuggestion.summary}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs font-medium uppercase text-gray-500">Category</div>
                  <div className="mt-1 text-gray-900">{aiSuggestion.category}</div>
                </div>
                <div>
                  <div className="text-xs font-medium uppercase text-gray-500">Priority</div>
                  <div className="mt-1 text-gray-900">{aiSuggestion.priority}</div>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-gray-500">Confidence</div>
                <div className="mt-1 text-gray-900">
                  {Math.round(aiSuggestion.confidence * 100)}% 璺?{aiSuggestion.risk_level}
                </div>
              </div>
              <div>
                <div className="text-xs font-medium uppercase text-gray-500">Reply draft</div>
                <p className="mt-1 whitespace-pre-wrap text-gray-800">{aiSuggestion.reply_draft}</p>
              </div>
              {aiSuggestion.requires_human_review && (
                <div className="border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                  Human review required before sending or changing ticket fields.
                </div>
              )}
            </div>
          )}
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Knowledge draft</h2>
          <p className="mt-1 text-xs text-gray-500">
            Create an internal draft from this resolved ticket.
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4 w-full"
            onClick={createKnowledgeDraft}
            loading={isCreatingKnowledgeDraft}
            disabled={!canCreateKnowledgeDraft}
          >
            Create draft
          </Button>
          {knowledgeDraft && (
            <div className="mt-4 border border-gray-200 p-3 text-sm">
              <div
                className="text-xs font-medium uppercase text-gray-500"
                data-testid="knowledge-draft-status"
              >
                {knowledgeDraft.status} / {knowledgeDraft.visibility}
              </div>
              <p className="mt-1 font-medium text-gray-900">{knowledgeDraft.title}</p>
              <p className="mt-2 text-gray-700">{knowledgeDraft.resolution}</p>
              {knowledgeDraft.status !== 'PUBLISHED' && (
                <Button
                  type="button"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={publishKnowledgeDraft}
                  loading={isPublishingKnowledge}
                >
                  Publish
                </Button>
              )}
            </div>
          )}
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Actions</h2>
          <div className="mt-4 grid gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => changeStatus('IN_PROGRESS')}
              disabled={isChangingStatus}
            >
              Start work
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => changeStatus('RESOLVED')}
              disabled={isChangingStatus}
            >
              Resolve
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => changeStatus('CLOSED')}
              disabled={isChangingStatus}
            >
              Close
            </Button>
          </div>
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Service targets</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div>
              <div className="text-xs font-medium uppercase text-gray-500">Template</div>
              <div className="mt-1 text-gray-900">
                {currentTicket.request_template_id || 'Custom request'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-gray-500">Response due</div>
              <div className="mt-1 text-gray-900">
                {currentTicket.response_due_at
                  ? new Date(currentTicket.response_due_at).toLocaleString()
                  : 'Not set'}
              </div>
            </div>
            <div>
              <div className="text-xs font-medium uppercase text-gray-500">Resolution due</div>
              <div className="mt-1 text-gray-900">
                {currentTicket.resolution_due_at
                  ? new Date(currentTicket.resolution_due_at).toLocaleString()
                  : 'Not set'}
              </div>
            </div>
          </div>
        </div>
        <div className="border border-gray-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-gray-900">Timeline</h2>
          <div className="mt-4 space-y-3">
            {events.map((event) => (
              <div key={event.id} className="text-sm">
                <div className="font-medium text-gray-900">{event.type}</div>
                <div className="text-xs text-gray-500">
                  {new Date(event.created_at).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
