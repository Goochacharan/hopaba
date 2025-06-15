
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PrivacyPolicy = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Privacy Policy</CardTitle>
          <p className="text-muted-foreground">Last updated: December 15, 2024</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <section>
            <h2 className="text-xl font-semibold mb-3">1. Introduction</h2>
            <p className="text-muted-foreground">
              Welcome to Chowkashi, your local business directory and marketplace. We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">2. Information We Collect</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">2.1 Account Information</h3>
              <p className="text-muted-foreground">
                When you register for an account, we collect your email address, full name, and password. This information is necessary to create and manage your account.
              </p>
              
              <h3 className="text-lg font-medium">2.2 Business Information</h3>
              <p className="text-muted-foreground">
                If you list a business, we collect business details including name, description, location, contact information, images, and services offered.
              </p>
              
              <h3 className="text-lg font-medium">2.3 Communication Data</h3>
              <p className="text-muted-foreground">
                We store messages sent through our platform for service requests, quotations, and business communications. This includes WhatsApp Business integration communications.
              </p>
              
              <h3 className="text-lg font-medium">2.4 Usage Information</h3>
              <p className="text-muted-foreground">
                We collect information about how you use our platform, including search queries, viewed listings, and interaction patterns to improve our services.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">3. How We Use Your Information</h2>
            <div className="space-y-2">
              <p className="text-muted-foreground">• To provide and maintain our services</p>
              <p className="text-muted-foreground">• To facilitate connections between customers and local businesses</p>
              <p className="text-muted-foreground">• To enable WhatsApp Business communications and service requests</p>
              <p className="text-muted-foreground">• To send you relevant notifications about service matches and responses</p>
              <p className="text-muted-foreground">• To improve our platform and develop new features</p>
              <p className="text-muted-foreground">• To prevent fraud and ensure platform security</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">4. Information Sharing</h2>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">4.1 Public Business Listings</h3>
              <p className="text-muted-foreground">
                Business information you choose to make public (name, description, location, contact details) will be visible to all platform users.
              </p>
              
              <h3 className="text-lg font-medium">4.2 Service Connections</h3>
              <p className="text-muted-foreground">
                When you request a service, we share your contact information with relevant service providers to facilitate communication.
              </p>
              
              <h3 className="text-lg font-medium">4.3 WhatsApp Business Integration</h3>
              <p className="text-muted-foreground">
                We may facilitate communications through WhatsApp Business API to connect customers with local businesses.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">5. Data Security</h2>
            <p className="text-muted-foreground">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your account is protected by encryption and secure authentication methods.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">6. Your Rights</h2>
            <div className="space-y-2">
              <p className="text-muted-foreground">• Access your personal information</p>
              <p className="text-muted-foreground">• Update or correct your information</p>
              <p className="text-muted-foreground">• Delete your account and associated data</p>
              <p className="text-muted-foreground">• Opt-out of non-essential communications</p>
              <p className="text-muted-foreground">• Export your data in a portable format</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">7. Local Business Directory</h2>
            <p className="text-muted-foreground">
              As a local business directory, we help users discover and connect with businesses in their area. Location data is used to provide relevant local search results and facilitate nearby service connections.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">8. Third-Party Services</h2>
            <p className="text-muted-foreground">
              We may integrate with third-party services such as WhatsApp Business API, mapping services, and payment processors. These services have their own privacy policies, and we encourage you to review them.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">9. Data Retention</h2>
            <p className="text-muted-foreground">
              We retain your information as long as your account is active or as needed to provide services. You may request deletion of your account and associated data at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">10. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">11. Contact Us</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className="mt-2 space-y-1 text-muted-foreground">
              <p>Email: privacy@chowkashi.com</p>
              <p>Address: Local Business Directory, India</p>
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPolicy;
