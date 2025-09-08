import React, { useEffect, useRef } from 'react';
import { models, service, factories } from 'powerbi-client';

interface PowerBIEmbedProps {
  embedUrl: string;
  accessToken: string;
  reportId: string;
}

const PowerBIEmbed: React.FC<PowerBIEmbedProps> = ({ embedUrl, accessToken, reportId }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reportRef.current) {
      const config: service.IEmbedConfiguration = {
        type: 'report',
        id: reportId,
        embedUrl: embedUrl,
        accessToken: accessToken,
        tokenType: models.TokenType.Embed,
        settings: {
          panes: {
            filters: { visible: false },
            pageNavigation: { visible: true }
          }
        }
      };

      const powerbiService = new service.Service(
        factories.hpmFactory,
        factories.wpmpFactory,
        factories.routerFactory
      );

      powerbiService.embed(reportRef.current, config);
    }
  }, [embedUrl, accessToken, reportId]);

  return <div ref={reportRef} style={{ height: '600px', width: '100%' }} />;
};

export default PowerBIEmbed;
