'use client';
import PanelCodeHighlight from '@/components/panel-code-highlight';
import React, { useState } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';

const ComponentsFormDatePickerDateTime = () => {
    const isRtl = false; // RTL support removed

    const [date2, setDate2] = useState<any>('2022-07-05 12:00');
    return (
        <PanelCodeHighlight
            title="Date Time"
            codeHighlight={`import { useState } from 'react';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
const [date2, setDate2] = useState<any>('2022-07-05 12:00');

<Flatpickr
    data-enable-time
    options={{
        enableTime: true,
        dateFormat: 'Y-m-d H:i',
        position: isRtl ? 'auto right' : 'auto left',
    }}
    defaultValue={date2}
    className="form-input"
    onChange={(date2) => setDate2(date2)}
/>`}
        >
            <div className="mb-2.5">
                Use
                <code className="text-danger">{` {enableTime: true, dateFormat: 'Y-m-d H:i'}`} </code>
                option to enable time support
            </div>
            <div className="mb-5">
                <Flatpickr
                    data-enable-time
                    options={{
                        enableTime: true,
                        dateFormat: 'Y-m-d H:i',
                        position: isRtl ? 'auto right' : 'auto left',
                    }}
                    defaultValue={date2}
                    className="form-input"
                    onChange={(date2) => setDate2(date2)}
                />
            </div>
        </PanelCodeHighlight>
    );
};

export default ComponentsFormDatePickerDateTime;
