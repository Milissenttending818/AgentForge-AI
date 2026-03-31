import { useState } from 'react';
import { ShieldCheck, Edit3, XCircle, AlertCircle } from 'lucide-react';

interface ApprovalModalProps {
  proposedAction: string;
  onDecision: (approved: boolean, editedPayload?: string) => void;
}

const ApprovalModal = ({ proposedAction, onDecision }: ApprovalModalProps) => {
  const [editedPayload, setEditedPayload] = useState(proposedAction);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[2000] p-4">
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-border bg-muted/30 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-tight">Security Approval</h3>
            <p className="text-[11px] text-muted-foreground">Action requires human validation</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle size={14} className="text-amber-500" />
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Proposed Action</span>
          </div>
          
          {isEditing ? (
            <textarea 
              className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
              value={editedPayload}
              onChange={(e) => setEditedPayload(e.target.value)}
            />
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg text-sm border border-border text-foreground/90 leading-relaxed italic">
              "{proposedAction || "The agent is ready to proceed. No specific payload defined."}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-muted/30 border-t border-border flex justify-end gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => onDecision(false)}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <XCircle size={16} className="mr-2" /> Reject
          </Button>
          
          {!isEditing && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit3 size={16} className="mr-2" /> Edit
            </Button>
          )}

          <Button 
            size="sm"
            onClick={() => onDecision(true, isEditing ? editedPayload : undefined)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
          >
            Approve & Resume
          </Button>
        </div>
      </div>
    </div>
  );
};

// Internal Button import since this is a separate file
import { Button } from "@/components/ui/button";

export default ApprovalModal;
